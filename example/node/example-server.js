const { resolve } = require('path')

const { clock } = require('../../output-gitignore/library/common/time')
const { time: formatTime } = require('../../output-gitignore/library/common/format')

const { readFileAsync, createPathPrefixLock } = require('../../output-gitignore/library/node/file/function')
const { createServer, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { responderEnd, createResponderParseURL } = require('../../output-gitignore/library/node/server/Responder/Common')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP } = require('../../output-gitignore/library/node/server/WebSocket/type')
const { enableWebSocketServer } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketServer')

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const ServerHost = 'localhost'
const ServerPort = 3000

const responderLogHeader = (store) => {
  const { url, method, headers, socket: { remoteAddress, remotePort } } = store.request
  const host = headers[ 'host' ] || ''
  const userAgent = headers[ 'user-agent' ] || ''
  console.log(`${new Date().toISOString()} [REQUEST] ${method} ${host}${url} ${remoteAddress}:${remotePort} ${userAgent}`)
}
const responderLogTimeStep = () => (store) => {
  const state = store.getState()
  const stepTime = clock()
  console.log(`${new Date().toISOString()} [STEP] ${formatTime(stepTime - (state.stepTime || state.time))}`)
  store.setState({ stepTime })
}
const responderLogEnd = (store) => {
  const state = store.getState()
  state.error && console.error(state.error)
  const errorLog = state.error
    ? `[ERROR] ${store.request.method} ${store.request.url} ${store.response.finished ? 'finished' : 'not-finished'} ${state.error}`
    : ''
  console.log(`${new Date().toISOString()} [END] ${formatTime(clock() - state.time)} ${store.response.statusCode} ${errorLog}`)
}
const responderServeStatic = createResponderServeStatic({})

const { server, start, option } = createServer({ protocol: 'http:', hostname: ServerHost, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    responderLogHeader,
    createResponderParseURL(option),
    responderLogTimeStep,
    createResponderRouter(createRouteMap([
      [ '/favicon.ico', 'GET', (store) => responderServeStatic(store, fromStaticRoot('resource/favicon.ico')) ],
      [ '/', 'GET', (store) => responderServeStatic(store, fromStaticRoot('/node/example-server.html')) ],
      [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ]
    ]))
  ],
  responderEnd: async (store) => {
    await responderEnd(store)
    await responderLogEnd(store)
  }
}))

const webSocketSet = enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
    // return webSocket.doCloseSocket() // can just close here

    const { origin, protocolList, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
      console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`)
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, async (webSocket, { dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))

      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG STRING') return webSocket.sendText(await readFileAsync(fromPath('../resource/favicon.ico'), 'utf8'))
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG BUFFER') return webSocket.sendBuffer(await readFileAsync(fromPath('../resource/favicon.ico')))

      // echo back
      dataType === DATA_TYPE_MAP.OPCODE_TEXT && webSocket.sendText(dataBuffer.toString())
      dataType === DATA_TYPE_MAP.OPCODE_BINARY && webSocket.sendBuffer(dataBuffer)
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      console.log(`>> CLOSE, current active: ${webSocketSet.size} (self included)`)
    })

    return protocolList[ 0 ]
  }
})

start()
console.log(`Server running at: 'http://${ServerHost}:${ServerPort}'`)
