const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../Dr.node')

// console.log(Object.keys(Dr))
// console.log(Object.keys(Dr.Node))

const {
  createServer,
  createRequestListener,
  Responder: {
    createResponderParseURL,
    createRouterMapBuilder,
    createResponderRouter,
    createResponderServeStatic,
    createResponderLogRequestHeader,
    createResponderLogTimeStep,
    createResponderLogEnd
  },
  WebSocket: {
    WEB_SOCKET_EVENT_MAP,
    DATA_TYPE_MAP,
    enableWebSocketServer
  }
} = Dr.Node.Server

const readFileAsync = promisify(nodeModuleFs.readFile)

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)

const responderServeStatic = createResponderServeStatic({ staticRoot: fromPath('../') })

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/', 'GET', (store) => {
  store.setState({ filePath: '/node/example-server.html' })
  return responderServeStatic(store)
})
routerMapBuilder.addRoute('/static/*', 'GET', (store) => {
  store.setState({ filePath: store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ] })
  return responderServeStatic(store)
})

const { server, start, baseUrl } = createServer({ protocol: 'http:', hostname: 'localhost', port: 3000 })

server.on('request', createRequestListener({
  responderList: [
    createResponderLogRequestHeader((data) => console.log('[LogRequestHeader]', data)),
    createResponderParseURL(baseUrl),
    createResponderLogTimeStep((timeStep) => console.log('[LogTimeStep]', timeStep)),
    createResponderRouter(routerMapBuilder.getRouterMap()),
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
