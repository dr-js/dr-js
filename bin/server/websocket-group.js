import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { Common, Node } from 'module/Dr.node'
import { responderSendFavicon } from './__utils__'

const { Module: { BASIC_EXTENSION_MAP }, Format, Time } = Common
const {
  System: { getNetworkIPv4AddressList },
  Buffer: { packBufferPacket, parseBufferPacket },
  Server: {
    createServer, createRequestListener,
    Responder: {
      responderEnd, responderEndWithRedirect,
      responderSendBuffer,
      createResponderRouter, createRouteMap, getRouteParamAny,
      createResponderParseURL
    },
    WebSocket: { WEB_SOCKET_EVENT_MAP, DATA_TYPE_MAP, enableWebSocketServer, createUpdateRequestListener }
  }
} = Node

const enableProtocolBufferPacket = (webSocket, onData) => webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, async (_, { dataType, dataBuffer }) => {
  __DEV__ && console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))
  if (dataType !== DATA_TYPE_MAP.OPCODE_BINARY) return webSocket.close(1000, 'OPCODE_BINARY opcode expected')
  try { await onData(parseBufferPacket(dataBuffer)) } catch (error) {
    __DEV__ && console.warn('[ERROR][enableProtocolBufferPacket]', error)
    webSocket.close(1000, error.toString())
  }
})

const authGroupInfoListMap = {}
const upgradeRequestProtocol = (store) => {
  const { webSocket } = store
  const { groupPath, name } = store.getState()
  let groupInfoList
  const sendGroupUpdate = () => {
    const buffer = packBufferPacket(JSON.stringify({ type: 'groupInfo', payload: groupInfoList.map(({ name }) => name) }))
    groupInfoList.forEach((v) => v.webSocket.sendBuffer(buffer))
  }
  webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
    if (authGroupInfoListMap[ groupPath ] === undefined) authGroupInfoListMap[ groupPath ] = []
    groupInfoList = authGroupInfoListMap[ groupPath ]
    groupInfoList.push({ name, webSocket })
    sendGroupUpdate()
    __DEV__ && console.log(`[responderUpdateRequestAuth] >> OPEN, current group: ${groupInfoList.length} (self included)`, groupPath)
  })
  webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
    const groupInfoIndex = groupInfoList.findIndex((v) => v.webSocket === webSocket)
    groupInfoList.splice(groupInfoIndex, 1)
    if (groupInfoList.length === 0) delete authGroupInfoListMap[ groupPath ]
    sendGroupUpdate()
    __DEV__ && console.log(`[responderUpdateRequestAuth] >> CLOSE, current group: ${groupInfoList.length} (self included)`, groupPath)
  })
  enableProtocolBufferPacket(webSocket, ([ headerString, payloadBuffer ]) => {
    const { type, payload } = JSON.parse(headerString)
    if (type === 'close') return webSocket.close(1000, 'CLOSE received')
    if (type === 'buffer') {
      const headerString = JSON.stringify({ type, payload: { ...payload, name } })
      const buffer = packBufferPacket(headerString, payloadBuffer)
      groupInfoList.forEach((v) => v.webSocket !== webSocket && v.webSocket.sendBuffer(buffer))
    }
  })
}

const FRAME_LENGTH_LIMIT = 512 * 1024 * 1024 // 512 MiB
const PROTOCOL_TYPE_SET = new Set([ 'group-binary-packet' ])
const responderWebsocketGroupUpgrade = async (store) => {
  const { origin, protocolList, isSecure } = store.webSocket
  __DEV__ && console.log('[responderWebsocketGroupUpgrade]', { origin, protocolList, isSecure }, store.bodyHeadBuffer.length)
  const groupPath = getRouteParamAny(store) // TODO: should verify groupPath
  if (!groupPath) return
  const name = store.getState().url.searchParams.get('name') // TODO: should verify name
  if (!name) return
  __DEV__ && console.log('[responderWebsocketGroupUpgrade] pass groupPath', groupPath)
  const protocol = getProtocol(protocolList, PROTOCOL_TYPE_SET)
  if (!protocol) return
  __DEV__ && console.log('[responderWebsocketGroupUpgrade] pass protocol', protocol)
  store.setState({ protocol, groupPath, name })
  upgradeRequestProtocol(store)
}

const getProtocol = (protocolList, protocolTypeSet) => {
  const protocol = protocolList.find(protocolTypeSet.has, protocolTypeSet)
  __DEV__ && !protocol && console.log('[getProtocol] no valid protocol:', protocolList)
  return protocol
}

const createServerWebSocketGroup = ({ protocol, hostname, port }) => {
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
      console.log(`[${new Date().toISOString()}|${method}] ${store.request.url} (${Format.time(Time.clock() - time)})`)
    }
  }))
  start()
  console.log(`[ServerWebSocketGroup]`)
  console.log(`  running at:\n    - '${protocol}//${hostname}:${port}'`)
  hostname === '0.0.0.0' && console.log(`  connect at:\n${Format.stringIndentLine(
    getNetworkIPv4AddressList().map(({ address }) => `'${protocol}//${address}:${port}'`).join('\n'),
    '    - '
  )}`)
}

const BUFFER_HTML = Buffer.from(`<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="minimum-scale=1, width=device-width">
<title>WebSocket Group</title>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
button { text-decoration: none; font-size: 14px; }
button:hover { background: #eee; }
label { display: flex; align-items: center; }
input { flex: 1; }
p { position: relative; padding: 14px 8px 8px; border-top: 1px solid #ddd; word-break: break-all; }
@media (pointer: coarse) { input, button { min-height: 32px; line-height: 32px; font-size: 18px; } }
@media (pointer: fine) { input, button { font-size: 14px; } }
.flex-column { display: flex; flex-flow: column; }
.non-flex { flex-shrink: 0; }
.self-log { color: #2a2 }
.alert-log { font-weight: bold; color: #a22 }
.time-tag { position: absolute; right: 0; top: 0; font-size: 12px; color: #f99 }
</style>
<div class="flex-column" style="overflow: hidden; width: 100vw; height: 100vh; font-family: monospace;">
  <div id="setup" class="flex-column">
    <input id="group-path" type="text" placeholder="group-path" />
    <input id="display-name" type="text" placeholder="display-name" />
  </div>
  <button id="button-toggle">Open</button>
  <div id="main" class="flex-column" style="display: none;">
    <label for="payload-text" class="non-flex">Message Text: </label>
    <textarea id="payload-text" class="non-flex" style="min-height: 48px;"></textarea>
    <label class="non-flex">Message File: <input id="payload-file" type="file" /></label>
    <button id="button-send" class="non-flex">Send</button>
    <div id="log" style="overflow-y: auto; flex: 1; min-height: 0;"></div>
    <button id="button-log-clear" class="non-flex">Clear Log</button>
  </div>
</div>
<script>${nodeModuleFs.readFileSync(nodeModulePath.resolve(__dirname, '../../library/Dr.browser.js'), 'utf8')}</script>
<script>
  const {
    Common: { Math: { getRandomId } },
    Browser: { Blob: { packBlobPacket, parseBlobPacket }, Resource: { createDownloadBlob } }
  } = window.Dr

  const qS = (selector) => document.querySelector(selector)
  const qSS = (selector, innerHTML) => { qS(selector).innerHTML = innerHTML }
  const cT = (tagName, attributeMap) => Object.assign(document.createElement(tagName), attributeMap)

  const appendLogTag = (logTag) => {
    logTag.appendChild(cT('span', { innerHTML: new Date().toLocaleString(), className: 'time-tag' }))
    const log = qS('#log')
    log.appendChild(logTag)
    log.scrollTop = log.scrollHeight
  }
  const addLog = (text) => appendLogTag(cT('p', { innerHTML: text }))
  const addLogSelf = (text) => appendLogTag(cT('p', { innerHTML: text, className: 'self-log' }))
  const addLogAlert = (text) => appendLogTag(cT('p', { innerHTML: text, className: 'alert-log' }))
  const addLogWithFile = (text, fileName, fileType, fileBlob) => {
    const logTag = cT('p', { innerHTML: text })
    logTag.appendChild(cT('button', { innerHTML: '📄' + fileName, onclick: () => createDownloadBlob(fileName, [ fileBlob ], fileType) }))
    appendLogTag(logTag)
  }
  const clearLog = () => qSS('#log', '')

  const STATE = { websocket: null, groupPath: null, displayName: null }
  const onCloseWebSocket = () => {
    STATE.websocket = null
    STATE.groupPath = null
    STATE.displayName = null
    qS('#setup').style.display = ''
    qS('#main').style.display = 'none'
    qSS('#button-toggle', 'Open')
    addLogAlert('-- [websocket closed] --')
  }
  const onOpenWebSocket = ({ websocket, groupPath, displayName }) => {
    STATE.websocket = websocket
    STATE.groupPath = groupPath
    STATE.displayName = displayName
    qS('#setup').style.display = 'none'
    qS('#main').style.display = ''
    qSS('#button-toggle', 'Close')
    addLogAlert('-- [websocket opened, group-path: ' + groupPath + ', display-name: ' + displayName + '] --')
  }
  const getWebSocketGroupUrl = (groupPath, displayName) => (window.location.protocol === 'https:' ? 'wss:' : 'ws:') +
    '//' + window.location.host + '/websocket-group/' + encodeURI(groupPath) +
    '?name=' + encodeURIComponent(displayName)

  qS('#button-toggle').onclick = () => {
    if (STATE.websocket) {
      STATE.websocket.send(packBlobPacket(JSON.stringify({ type: 'close' })))
      onCloseWebSocket()
    } else {
      const groupPath = qS('#group-path').value || 'default'
      const displayName = qS('#display-name').value || getRandomId('User ')
      const websocket = new window.WebSocket(getWebSocketGroupUrl(groupPath, displayName), 'group-binary-packet')
      websocket.addEventListener('close', onCloseWebSocket)
      websocket.addEventListener('error', onCloseWebSocket)
      websocket.addEventListener('message', async ({ data }) => {
        const [ headerString, payloadBlob ] = await parseBlobPacket(data)
        const { type, payload } = JSON.parse(headerString)
        if (type === 'buffer') {
          const { name, text, fileName, fileType } = payload
          text && addLog('[' + name + '] ' + text)
          fileName && addLogWithFile('[' + name + '] get ', fileName, fileType, payloadBlob)
        } else if (type === 'groupInfo') addLogAlert('-- [websocket group: ' + JSON.stringify(payload) + '] --')
      })
      onOpenWebSocket({ websocket, groupPath, displayName })
    }
  }
  qS('#button-send').onclick = () => {
    if (!STATE.websocket) return
    const text = qS('#payload-text').value
    const file = qS('#payload-file').files[ 0 ]
    const fileName = file && file.name
    const fileType = file && file.type
    text && addLogSelf('[' + STATE.displayName + '] ' + text)
    fileName && addLogSelf('[' + STATE.displayName + '] send 📄' + fileName)
    if (text || file) STATE.websocket.send(packBlobPacket(JSON.stringify({ type: 'buffer', payload: { text, fileName, fileType } }), file))
  }
  qS('#button-log-clear').onclick = clearLog
</script>
`)

export { createServerWebSocketGroup }
