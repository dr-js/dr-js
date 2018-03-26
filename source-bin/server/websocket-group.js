import { resolve } from 'path'
import { readFileSync } from 'fs'
import { clock } from 'dr-js/module/common/time'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { time as formatTime } from 'dr-js/module/common/format'
import { packBufferPacket, parseBufferPacket } from 'dr-js/module/node/data/BufferPacket'
import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, responderEndWithRedirect, responderSendBuffer, createResponderParseURL } from 'dr-js/module/node/server/Responder/Common'
import { createResponderRouter, createRouteMap, getRouteParamAny } from 'dr-js/module/node/server/Responder/Router'
import { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP } from 'dr-js/module/node/server/WebSocket/type'
import { enableWebSocketServer } from 'dr-js/module/node/server/WebSocket/WebSocketServer'
import { createUpdateRequestListener } from 'dr-js/module/node/server/WebSocket/WebSocketUpgradeRequest'
import { responderSendFavicon, getServerInfo } from './function'

const TYPE_CLOSE = '#CLOSE'
const TYPE_INFO_GROUP = '#INFO_GROUP'
const TYPE_INFO_USER = '#INFO_USER'
const TYPE_BUFFER_GROUP = '#BUFFER_GROUP'
const TYPE_BUFFER_SINGLE = '#BUFFER_SINGLE'

const wrapFrameBufferPacket = (onData) => async (webSocket, { dataType, dataBuffer }) => {
  __DEV__ && console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))
  if (dataType !== DATA_TYPE_MAP.OPCODE_BINARY) return webSocket.close(1000, 'OPCODE_BINARY expected')
  try { await onData(parseBufferPacket(dataBuffer)) } catch (error) {
    __DEV__ && console.warn('[ERROR][wrapFrameBufferPacket]', error)
    webSocket.close(1000, error.toString())
  }
}

const groupInfoMap = {}
const groupIdSetMap = {}

const addUser = (groupPath, id, webSocket) => {
  if (groupIdSetMap[ groupPath ] === undefined) groupIdSetMap[ groupPath ] = new Set()
  const groupIdSet = groupIdSetMap[ groupPath ]
  groupIdSet.add(id)
  if (groupInfoMap[ groupPath ] === undefined) groupInfoMap[ groupPath ] = new Map()
  const groupInfo = groupInfoMap[ groupPath ]
  groupInfo.set(id, { id, webSocket, groupIdSet })
  return groupInfo
}

const deleteUser = (groupPath, id) => {
  const groupIdSet = groupIdSetMap[ groupPath ]
  groupIdSet && groupIdSet.delete(id)
  if (groupIdSet && groupIdSet.size === 0) delete groupIdSetMap[ groupPath ]
  const groupInfo = groupInfoMap[ groupPath ]
  groupInfo && groupInfo.delete(id)
  if (groupInfo && groupInfo.size === 0) delete groupInfoMap[ groupPath ]
  return groupInfo
}

const fixUserIdClash = (groupPath, id) => {
  const groupIdSet = groupIdSetMap[ groupPath ]
  if (!groupIdSet || !groupIdSet.has(id)) return id
  let suffix = 1
  while (groupIdSet.has(`${id}${suffix}`)) suffix++
  return `${id}${suffix}`
}

const upgradeRequestProtocol = (store) => {
  const { webSocket } = store
  const { groupPath, id } = store.getState()
  const sendGroupInfo = (groupInfo) => {
    if (groupInfo.size === 0) return
    const buffer = packBufferPacket(JSON.stringify({ type: TYPE_INFO_GROUP, payload: Array.from(groupIdSetMap[ groupPath ]) }))
    groupInfo.forEach((v) => v.webSocket.sendBuffer(buffer))
  }
  const sendGroupBuffer = (groupInfo, type, payload, payloadBuffer) => {
    if (groupInfo.size <= 1) return
    const buffer = packBufferPacket(JSON.stringify({ type, payload: { ...payload, id } }), payloadBuffer)
    groupInfo.forEach((v) => {
      __DEV__ && v.id !== id && console.log('[sendGroupBuffer] send buffer to', v.id)
      v.id !== id && v.webSocket.sendBuffer(buffer)
    })
  }
  const sendTargetBuffer = (groupInfo, type, payload, targetId, payloadBuffer) => {
    const targetInfo = groupInfo.get(targetId)
    __DEV__ && targetInfo && console.log('[sendTargetBuffer] send buffer to', targetInfo.id)
    targetInfo && targetInfo.webSocket.sendBuffer(packBufferPacket(JSON.stringify({ type, targetId, payload: { ...payload, id } }), payloadBuffer))
  }
  webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
    const groupInfo = addUser(groupPath, id, webSocket)
    webSocket.sendBuffer(packBufferPacket(JSON.stringify({ type: TYPE_INFO_USER, payload: { groupPath, id } })))
    sendGroupInfo(groupInfo)
    __DEV__ && console.log(`[RequestProtocol] >> OPEN, current group: ${groupInfo.size} (self included)`, groupPath)
  })
  webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
    const groupInfo = deleteUser(groupPath, id)
    sendGroupInfo(groupInfo)
    __DEV__ && console.log(`[RequestProtocol] >> CLOSE, current group: ${groupInfo.size} (self included)`, groupPath)
  })
  webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, wrapFrameBufferPacket(([ headerString, payloadBuffer ]) => {
    const { type, payload, targetId } = JSON.parse(headerString)
    if (type === TYPE_CLOSE) webSocket.close(1000, 'CLOSE received')
    if (type === TYPE_BUFFER_GROUP) sendGroupBuffer(groupInfoMap[ groupPath ], type, payload, payloadBuffer)
    if (type === TYPE_BUFFER_SINGLE) sendTargetBuffer(groupInfoMap[ groupPath ], type, payload, targetId, payloadBuffer)
  }))
}

const FRAME_LENGTH_LIMIT = 512 * 1024 * 1024 // 512 MiB
const PROTOCOL_TYPE_SET = new Set([ 'group-binary-packet' ])
const responderWebsocketGroupUpgrade = async (store) => {
  const { origin, protocolList, isSecure } = store.webSocket
  __DEV__ && console.log('[responderWebsocketGroupUpgrade]', { origin, protocolList, isSecure }, store.bodyHeadBuffer.length)
  const groupPath = getRouteParamAny(store)
  const id = store.getState().url.searchParams.get('id')
  const protocol = getProtocol(protocolList, PROTOCOL_TYPE_SET)
  if (!groupPath || !id || !protocol) return
  __DEV__ && console.log('[responderWebsocketGroupUpgrade] pass', { groupPath, id, protocol })
  store.setState({ protocol, groupPath, id: fixUserIdClash(groupPath, id) })
  upgradeRequestProtocol(store)
}

const getProtocol = (protocolList, protocolTypeSet) => {
  const protocol = protocolList.find(protocolTypeSet.has, protocolTypeSet)
  __DEV__ && !protocol && console.log('[getProtocol] no valid protocol:', protocolList)
  return protocol
}

const loadTextFile = (path) => readFileSync(resolve(__dirname, path), 'utf8')

const createServerWebSocketGroup = ({ protocol, hostname, port, log }) => {
  const BUFFER_HTML = Buffer.from(loadTextFile('./websocket-group.template.html')
    .replace(`"{SCRIPT_DR_BROWSER_JS}"`, loadTextFile('../../library/Dr.browser.js'))
    .replace(`"{TYPE_LIST}"`, JSON.stringify([ TYPE_CLOSE, TYPE_INFO_GROUP, TYPE_INFO_USER, TYPE_BUFFER_GROUP, TYPE_BUFFER_SINGLE ]))
  )

  const { server, start, option } = createServer({ protocol, hostname, port })

  enableWebSocketServer({
    server,
    onUpgradeRequest: createUpdateRequestListener({
      responderList: [
        createResponderParseURL(option),
        createResponderRouter(createRouteMap([ [ '/websocket-group/*', 'GET', responderWebsocketGroupUpgrade ] ]))
      ]
    }),
    frameLengthLimit: FRAME_LENGTH_LIMIT
  })

  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouteMap([
        [ '/', 'GET', (store) => responderSendBuffer(store, { buffer: BUFFER_HTML, type: BASIC_EXTENSION_MAP.html }) ],
        [ '/*', 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/' }) ],
        [ '/favicon.ico', 'GET', responderSendFavicon ]
      ]))
    ],
    responderEnd: async (store) => {
      await responderEnd(store)
      const { time, method } = store.getState()
      log(`[${new Date().toISOString()}|${method}] ${store.request.url} (${formatTime(clock() - time)})`)
    }
  }))

  start()

  log(getServerInfo('ServerWebSocketGroup', protocol, hostname, port))
}

export { createServerWebSocketGroup }
