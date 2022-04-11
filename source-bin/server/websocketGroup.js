import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } from 'source/common/module/HTML.js'

import { packBufferPacket, parseBufferPacket } from 'source/node/data/BufferPacket.js'
import { createResponderLog, responderEndWithRedirect } from 'source/node/server/Responder/Common.js'
import { responderSendBufferCompress, prepareBufferData } from 'source/node/server/Responder/Send.js'
import { createResponderRouter, createRouteMap, getRouteParamAny } from 'source/node/server/Responder/Router.js'
import { OPCODE_TYPE } from 'source/node/server/WS/function.js'
import { enableWSServer, createUpgradeRequestListener } from 'source/node/server/WS/Server.js'
import { DR_BROWSER_SCRIPT_TAG } from 'source/node/server/function.js'

const TYPE_CLOSE = '#CLOSE'
const TYPE_INFO_GROUP = '#INFO_GROUP'
const TYPE_INFO_USER = '#INFO_USER'
const TYPE_BUFFER_GROUP = '#BUFFER_GROUP'
const TYPE_BUFFER_SINGLE = '#BUFFER_SINGLE'

// TODO: keep limited message history?

const groupInfoMap = {}
const groupIdSetMap = {}

const addUser = (groupPath, id, ws) => {
  if (groupIdSetMap[ groupPath ] === undefined) groupIdSetMap[ groupPath ] = new Set()
  const groupIdSet = groupIdSetMap[ groupPath ]
  groupIdSet.add(id)
  if (groupInfoMap[ groupPath ] === undefined) groupInfoMap[ groupPath ] = new Map()
  const groupInfo = groupInfoMap[ groupPath ]
  groupInfo.set(id, { id, ws, groupIdSet })
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
  const prefix = id.replace(/-*\d+$/, '')
  let suffix = 1
  while (groupIdSet.has(`${prefix}-${suffix}`)) suffix++
  return `${prefix}-${suffix}`
}

const groupMain = async (store) => {
  const { ws } = store
  const { groupPath, id } = store.getState()
  const sendGroupInfo = (groupInfo) => {
    if (groupInfo.size === 0) return
    const buffer = packBufferPacket(JSON.stringify({ type: TYPE_INFO_GROUP, payload: Array.from(groupIdSetMap[ groupPath ]) }))
    groupInfo.forEach((v) => v.ws.sendBinary(buffer))
  }
  const sendGroupBuffer = (groupInfo, type, payload, payloadBuffer) => {
    if (groupInfo.size <= 1) return
    const buffer = packBufferPacket(JSON.stringify({ type, payload: { ...payload, id } }), payloadBuffer)
    groupInfo.forEach((v) => {
      __DEV__ && v.id !== id && console.log('[sendGroupBuffer] send buffer to', v.id)
      v.id !== id && v.ws.sendBinary(buffer)
    })
  }
  const sendTargetBuffer = (groupInfo, type, payload, targetId, payloadBuffer) => {
    const targetInfo = groupInfo.get(targetId)
    __DEV__ && targetInfo && console.log('[sendTargetBuffer] send buffer to', targetInfo.id)
    targetInfo && targetInfo.ws.sendBinary(packBufferPacket(JSON.stringify({ type, targetId, payload: { ...payload, id } }), payloadBuffer))
  }

  const groupInfo = addUser(groupPath, id, ws)
  await ws.sendBinary(packBufferPacket(JSON.stringify({ type: TYPE_INFO_USER, payload: { groupPath, id } })))
  sendGroupInfo(groupInfo)
  __DEV__ && console.log(`[RequestProtocol] >> OPEN, current group: ${groupInfo.size} (self included)`, groupPath)

  try {
    for await (const { opcode, buffer } of ws) {
      __DEV__ && console.log('>> FRAME:', opcode, buffer.length) // String(buffer).slice(0, 20)
      if (opcode !== OPCODE_TYPE.BINARY) throw new Error('expect BINARY')
      const [ headerString, payloadBuffer ] = parseBufferPacket(buffer)
      const { type, payload, targetId } = JSON.parse(headerString)
      if (type === TYPE_CLOSE) ws.close(1000, 'CLOSE received')
      if (type === TYPE_BUFFER_GROUP) sendGroupBuffer(groupInfo, type, payload, payloadBuffer)
      if (type === TYPE_BUFFER_SINGLE) sendTargetBuffer(groupInfo, type, payload, targetId, payloadBuffer)
    }
  } catch (error) {
    __DEV__ && error && console.warn('[ERROR][wrapFrameBufferPacket]', error)
    error && ws.close(1000, String(error))
  }

  deleteUser(groupPath, id)
  sendGroupInfo(groupInfo)
  __DEV__ && console.log(`[RequestProtocol] >> CLOSE, current group: ${groupInfo.size} (self included)`, groupPath)
}

const DATA_LENGTH_LIMIT = 256 * 1024 * 1024 // 256 MiB
const PROTOCOL_TYPE_SET = new Set([ 'group-binary-packet' ])
const responderWebSocketGroupUpgrade = async (store) => {
  const { url: { searchParams }, info: { protocolList } } = store.getState() // TODO: depend on createResponderRouter
  __DEV__ && console.log('[responderWebSocketGroupUpgrade]', { protocolList }, store.getState().headBuffer.length)
  const groupPath = decodeURIComponent(getRouteParamAny(store) || '')
  const id = searchParams.get('id')
  const protocol = getProtocol(protocolList, PROTOCOL_TYPE_SET)
  __DEV__ && console.log('[responderWebSocketGroupUpgrade]', { groupPath, id, protocol })
  if (!groupPath || !id || !protocol) return
  store.upgradeWS(protocol)
  store.setState({ groupPath, id: fixUserIdClash(groupPath, id) })
  await groupMain(store)
}

const getProtocol = (protocolList, protocolTypeSet) => {
  const protocol = protocolList.find(protocolTypeSet.has, protocolTypeSet)
  __DEV__ && !protocol && console.log('[getProtocol] no valid protocol:', protocolList)
  return protocol
}

const configure = ({ serverExot, log, routePrefix }) => {
  const bufferData = prepareBufferData(Buffer.from(COMMON_LAYOUT([
    COMMON_STYLE(),
    mainStyle
  ], [
    mainHTML,
    COMMON_SCRIPT({
      TYPE_CLOSE,
      TYPE_INFO_GROUP,
      TYPE_INFO_USER,
      TYPE_BUFFER_GROUP,
      TYPE_BUFFER_SINGLE,
      DATA_LENGTH_LIMIT,
      ROUTE_PREFIX: routePrefix,
      onload: mainScriptInit
    }),
    DR_BROWSER_SCRIPT_TAG()
  ])), BASIC_EXTENSION_MAP.html)

  const routeConfigList = [
    [ [ '/', '' ], 'GET', (store) => responderSendBufferCompress(store, bufferData) ],
    [ '/*', 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: `${routePrefix}/` }) ]
  ]

  enableWSServer(serverExot.server, {
    onUpgradeRequest: createUpgradeRequestListener({
      responderList: [
        createResponderLog({ log }),
        createResponderRouter({
          routeMap: createRouteMap([ [ '/websocket-group/*', 'GET', responderWebSocketGroupUpgrade ] ], routePrefix),
          serverExot
        })
      ]
    }),
    dataLengthLimit: DATA_LENGTH_LIMIT // TODO: TEST not crash server
  })

  return {
    routeConfigList,
    isAddFavicon: true,
    title: 'WebSocketGroup'
  }
}

const mainStyle = `<style>
label { display: flex; align-items: center; }
p { position: relative; padding: 14px 4px 2px; border-top: 1px solid var(--c-fill-n); word-break: break-all; }
p:hover { background: var(--c-fill-s); }
pre { overflow: auto; padding: 0 2px; max-height: 10em; border-left: 1px solid var(--c-fill-n); color: #888; }
input { flex: 1; }
.flex-column { display: flex; flex-flow: column; }
.non-flex { flex-shrink: 0; }
.time-tag, .id-tag { position: absolute; top: 0; font-size: 12px; line-height: 12px; }
.time-tag { right: 0; color: var(--c-fill-d); }
.id-tag { left: 0; }
.color-self { color: var(--c-dr); }
.color-system { color: var(--c-fill-d); }
</style>`

const mainHTML = `
<div id="setup" class="flex-column">
  <input id="group-path" class="auto-height" type="text" placeholder="group-path" autofocus />
  <input id="id" class="auto-height" type="text" placeholder="id" />
</div>
<button id="button-toggle"></button>
<div id="log" style="overflow-y: auto; flex: 1; min-height: 0;"></div>
<button id="button-log-clear" class="non-flex">Clear Log [Ctrl+l]</button>
<div id="main" class="flex-column non-flex">
  <label for="payload-text">Message Text: </label>
  <textarea id="payload-text" style="min-height: 6em;"></textarea>
  <label>Message File: <input id="payload-file" class="auto-height" type="file" /></label>
  <button id="button-send"></button>
</div>
`

const mainScriptInit = () => {
  const {
    document, alert, getSelection, location, Blob, WebSocket,
    qS, cE,
    TYPE_CLOSE, TYPE_INFO_GROUP, TYPE_INFO_USER, TYPE_BUFFER_GROUP, TYPE_BUFFER_SINGLE,
    DATA_LENGTH_LIMIT,
    ROUTE_PREFIX,
    Dr: {
      Common: {
        Time: { setTimeoutAsync },
        Function: { lossyAsync },
        Error: { withFallbackResult },
        Math: { getRandomInt, getRandomId },
        Format: { binary }
      },
      Browser: {
        Data: { BlobPacket: { packBlobPacket, parseBlobPacket } },
        DOM: { applyReceiveFileListListener, createDownloadWithBlob },
        Input: { KeyCommand: { createKeyCommandHub } }
      }
    }
  } = window

  const idTag = (id, className = '') => cE('span', { innerText: `[${id}]`, className: `id-tag ${className}` })
  const timeTag = () => cE('span', { innerText: new Date().toLocaleString(), className: 'time-tag' })

  const appendLog = (...elementList) => {
    const log = qS('#log')
    const item = cE('p', { id: getRandomId() }, elementList)
    log.appendChild(item)
    log.scrollTop = log.scrollHeight
    return item
  }

  const addLog = ({ id, text, className }) => appendLog(
    cE('pre', { innerText: text, ondblclick: (event) => getSelection().selectAllChildren(event.currentTarget.parentNode.querySelector('pre')) }),
    idTag(id, className),
    timeTag()
  )
  const addLogWithFile = ({ isSend, id, fileName, fileSize, fileId, className }) => appendLog(
    cE('pre', { innerText: isSend ? 'sharing: ' : 'share: ' }),
    cE(isSend ? 'b' : 'button', { innerText: `📄 ${fileName} (${binary(fileSize)}B)`, onclick: isSend ? null : () => requestFile(id, fileId) }),
    idTag(id, className),
    timeTag()
  )
  const addLogSystem = (text) => appendLog(
    cE('pre', { innerText: text, className: 'color-system' }),
    idTag('System', 'color-system'),
    timeTag()
  )
  const clearLog = () => qS('#log', '')

  const getWebSocketGroupUrl = (groupPath, id) => {
    const { protocol, host } = location
    return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${ROUTE_PREFIX}/websocket-group/${encodeURIComponent(groupPath)}?id=${encodeURIComponent(id)}`
  }

  const saveSetup = (groupPath, id) => { location.hash = `#${new URLSearchParams({ GP: groupPath, ID: id })}` }
  const loadSetup = () => {
    const { GP: groupPath = '', ID: id = '' } = withFallbackResult({}, () => Object.fromEntries(new URLSearchParams(location.hash.slice(1)).entries()))
    return { groupPath, id }
  }

  const STATE = {
    fileWeakMap: new WeakMap(),
    retryCount: 0
  } // DOM - file-blob
  const onCloseWebSocket = () => {
    addLogSystem(`Left group: ${STATE.groupPath}`)
    qS('#setup').style.display = ''
    qS('#main').style.display = 'none'
    qS('#group-path').focus()
    qS('#button-toggle', 'Enter Group [Ctrl+d]')
    document.title = 'WebSocket Group'
    STATE.websocket = null
    STATE.groupPath = null
    STATE.id = null
    STATE.groupInfo = []
  }
  const onOpenWebSocket = ({ websocket, groupPath, id }) => {
    addLogSystem(`Join group: ${groupPath}, as: ${id}`)
    qS('#setup').style.display = 'none'
    qS('#main').style.display = ''
    qS('#payload-text').focus()
    qS('#button-toggle', `Exit Group: ${groupPath} [Ctrl+d]`)
    saveSetup(groupPath, id)
    document.title = `[${groupPath}/${id}]`
    STATE.websocket = websocket
    STATE.groupPath = groupPath
    STATE.id = id
    STATE.groupInfo = []
    STATE.retryCount = 0
  }
  const onErrorRetry = lossyAsync(async (error) => {
    onCloseWebSocket()
    await setTimeoutAsync(200 * STATE.retryCount)
    STATE.retryCount++
    STATE.retryCount <= 10 && addLogSystem(`(${STATE.retryCount}) connection dropped, try re-connect... [${error.message || error.type || error}]`)
    STATE.retryCount <= 10 && toggleWebSocket()
  }).trigger

  onCloseWebSocket() // reset STATE
  clearLog()

  const requestFile = (id, fileId) => {
    STATE.websocket.send(packBlobPacket(JSON.stringify({ type: TYPE_BUFFER_SINGLE, targetId: id, payload: { fileId, intent: 'request' } })))
  }

  const toggleWebSocket = () => {
    if (STATE.websocket) {
      STATE.websocket.send(packBlobPacket(JSON.stringify({ type: TYPE_CLOSE })))
      return
    }
    const groupPath = qS('#group-path').value.trim() || 'public'
    const id = qS('#id').value.trim() || getRandomUserId()
    const websocket = new WebSocket(getWebSocketGroupUrl(groupPath, id), 'group-binary-packet')
    websocket.binaryType = 'blob'
    const onOpenInfo = (id) => {
      qS('#group-path').value = groupPath
      qS('#id').value = id
      onOpenWebSocket({ websocket, groupPath, id })
    }
    websocket.addEventListener('error', onErrorRetry)
    websocket.addEventListener('close', ({ code }) => code === 1000
      ? onCloseWebSocket()
      : onErrorRetry(new Error(`server close with code: ${code}`))
    )
    websocket.addEventListener('message', ({ data }) => onMessage(data, onOpenInfo))
  }

  const getRandomUserId = () => {
    const tagList = Object.keys(window)
    return `User-${tagList[ getRandomInt(tagList.length - 1) ]}`
  }

  const onMessage = async (data, onOpenInfo) => {
    const [ headerString, payloadBlob ] = await parseBlobPacket(data)
    const { type, /* targetId, */ payload } = JSON.parse(headerString)
    if (type === TYPE_INFO_USER) {
      onOpenInfo(payload.id)
    } else if (type === TYPE_INFO_GROUP) {
      addLogSystem(`Current ${payload.length} user: ${payload.join(', ')}`)
      qS('#button-send').disabled = payload.length <= 1
      qS('#button-send', `Send to ${payload.length - 1} User [Ctrl+Enter]`)
      STATE.groupInfo = payload
    } else if (type === TYPE_BUFFER_GROUP) {
      const { id, text, fileName, fileSize, fileId } = payload
      text && addLog({ id, text })
      fileName && addLogWithFile({ id, fileName, fileSize, fileId })
    } else if (type === TYPE_BUFFER_SINGLE) {
      const { id, intent } = payload
      if (intent === 'request') {
        const { fileId } = payload
        const file = STATE.fileWeakMap.get(qS(`#${fileId}`))
        const fileName = file && file.name
        const fileType = file && file.type
        STATE.websocket.send(packBlobPacket(
          JSON.stringify({ type: TYPE_BUFFER_SINGLE, targetId: id, payload: { intent: 'response', ok: Boolean(file), fileName, fileType } }),
          file
        ))
        addLogSystem(file
          ? `Send file: ${fileName} to ${id}`
          : `Miss file request from ${id}`
        )
      } else if (intent === 'response') {
        const { ok, fileName, fileType } = payload
        ok && createDownloadWithBlob(fileName, new Blob([ payloadBlob ], { type: fileType }))
        addLogSystem(ok
          ? `Get file: ${fileName} from ${id}`
          : `Miss file response from ${id}`
        )
      }
    }
  }

  const sendPayload = () => {
    if (!STATE.websocket || STATE.groupInfo.length <= 1 || !qS('#payload-text')) return
    const text = qS('#payload-text').value.trim()
    const file = qS('#payload-file').files[ 0 ]
    qS('#payload-text').value = ''
    qS('#payload-file').value = ''
    if (!text && !file) return
    const fileName = file && file.name
    const fileSize = file && file.size
    if (fileSize > DATA_LENGTH_LIMIT) return alert(`fill size too big! max: ${binary(DATA_LENGTH_LIMIT)}B, get ${binary(fileSize)}B`)
    text && addLog({ id: STATE.id, text, className: 'color-self' })
    const fileTag = fileName && addLogWithFile({ isSend: true, id: STATE.id, fileName, fileSize, className: 'color-self' })
    STATE.websocket.send(packBlobPacket(JSON.stringify({ type: TYPE_BUFFER_GROUP, payload: { text, fileName, fileSize, fileId: fileTag && fileTag.id } })))
    fileName && STATE.fileWeakMap.set(fileTag, file)
  }

  qS('#button-log-clear').onclick = clearLog
  qS('#button-toggle').onclick = toggleWebSocket
  qS('#button-send').onclick = sendPayload

  const { groupPath, id } = loadSetup()
  qS('#group-path').value = groupPath
  qS('#id').value = id

  const { start, addKeyCommand } = createKeyCommandHub()
  addKeyCommand({ checkMap: { ctrlKey: true, key: 'd' }, callback: toggleWebSocket })
  addKeyCommand({ checkMap: { ctrlKey: true, key: 'l' }, callback: clearLog })
  addKeyCommand({ checkMap: { ctrlKey: true, key: 'Enter' }, callback: sendPayload })
  addKeyCommand({ target: qS('#group-path'), checkMap: { key: 'Enter' }, callback: toggleWebSocket })
  addKeyCommand({ target: qS('#id'), checkMap: { key: 'Enter' }, callback: toggleWebSocket })
  start()

  applyReceiveFileListListener(document, (fileList) => {
    const payloadFile = qS('#payload-file')
    if (payloadFile) payloadFile.files = fileList
  })
}

export { configure }
