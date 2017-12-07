const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../../library/Dr.node')

const {
  File: { createGetPathFromRoot },
  Server: {
    createServer, createRequestListener,
    Responder: {
      responderSendBuffer,
      createResponderParseURL,
      createResponderRouter, createRouteMap, getRouteParamAny,
      createResponderServeStatic,
      createResponderLogRequestHeader, createResponderLogTimeStep, createResponderLogEnd
    },
    WebSocket: { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP, enableWebSocketServer }
  }
} = Dr.Node

const readFileAsync = promisify(nodeModuleFs.readFile)

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)
const faviconBufferData = { buffer: nodeModuleFs.readFileSync(fromPath('../resource/favicon.ico')), type: 'image/png' }
const fromStaticRoot = createGetPathFromRoot(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const responderServeStatic = createResponderServeStatic({})

const { server, start, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: 3000 })
server.on('request', createRequestListener({
  responderList: [
    createResponderLogRequestHeader((data) => console.log('[LogRequestHeader]', data)),
    createResponderParseURL(option),
    createResponderLogTimeStep((timeStep) => console.log('[LogTimeStep]', timeStep)),
    createResponderRouter(createRouteMap([
      [ '/favicon.ico', 'GET', (store) => responderSendBuffer(store, faviconBufferData) ],
      [ '/', 'GET', (store) => responderServeStatic(store, fromStaticRoot('/node/example-server.html')) ],
      [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ]
    ])),
    createResponderLogEnd((data) => console.log('[LogEnd]', data))
  ]
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
