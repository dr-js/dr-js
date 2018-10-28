const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
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
    createResponderServeStaticSingleCached,

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

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)

const responderServeStatic = createResponderServeStatic({ staticRoot: fromPath('../') })
const responderServeIndex = createResponderServeStaticSingleCached({ staticFilePath: fromPath('./example-server.html') })
const responderServeFavicon = createResponderServeStaticSingleCached({ staticFilePath: fromPath('../browser/favicon.ico') })

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/', 'GET', responderServeIndex)
routerMapBuilder.addRoute('/favicon', 'GET', responderServeFavicon)
routerMapBuilder.addRoute('/favicon.ico', 'GET', responderServeFavicon)
routerMapBuilder.addRoute('/static/*', 'GET', (store) => {
  store.setState({ filePath: store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ] })
  return responderServeStatic(store)
})

const { server, start } = createServer({ hostName: 'localhost', port: 3000 }, 'HTTP')

server.on('request', createRequestListener({
  responderList: [
    createResponderLogRequestHeader((data) => console.log('[LogRequestHeader]', data)),
    createResponderParseURL(),
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
    webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, (webSocket, { dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))

      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG STRING') {
        return nodeModuleFs.readFile('../Dr.node.js', 'utf8', (error, dataString) => {
          if (error) throw error
          webSocket.sendText(dataString)
        })
      }
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG BUFFER') {
        return nodeModuleFs.readFile('../Dr.node.js', (error, dataBuffer) => {
          if (error) throw error
          webSocket.sendBuffer(dataBuffer)
        })
      }

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
