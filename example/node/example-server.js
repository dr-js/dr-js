const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const { Common, Node } = require('../../library/Dr.node')

const readFileAsync = promisify(nodeModuleFs.readFile)

const { Time: { clock }, Format } = Common
const {
  File: { createGetPathFromRoot },
  Server: {
    createServer, createRequestListener,
    Responder: {
      responderEnd,
      createResponderParseURL,
      createResponderRouter, createRouteMap, getRouteParamAny,
      createResponderServeStatic
    },
    WebSocket: { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP, enableWebSocketServer }
  }
} = Node

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)
const fromStaticRoot = createGetPathFromRoot(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const responderLogHeader = (store) => {
  const { url, method, headers, socket: { remoteAddress, remotePort } } = store.request
  const host = headers[ 'host' ] || ''
  const userAgent = headers[ 'user-agent' ] || ''
  console.log(`${new Date().toISOString()} [REQUEST] ${method} ${host}${url} ${remoteAddress}:${remotePort} ${userAgent}`)
}
const responderLogTimeStep = () => (store) => {
  const state = store.getState()
  const stepTime = clock()
  console.log(`${new Date().toISOString()} [STEP] ${Format.time(stepTime - (state.stepTime || state.time))}`)
  store.setState({ stepTime })
}
const responderLogEnd = (store) => {
  const state = store.getState()
  __DEV__ && state.error && console.error(state.error)
  const errorLog = state.error
    ? `[ERROR] ${store.request.method} ${store.request.url} ${store.response.finished ? 'finished' : 'not-finished'} ${state.error}`
    : ''
  console.log(`${new Date().toISOString()} [END] ${Format.time(clock() - state.time)} ${store.response.statusCode} ${errorLog}`)
}
const responderServeStatic = createResponderServeStatic({})

const { server, start, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: 3000 })
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
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG STRING') return webSocket.sendText(await readFileAsync(fromPath('../Dr.node.js'), 'utf8'))
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG BUFFER') return webSocket.sendBuffer(await readFileAsync(fromPath('../Dr.node.js')))

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
