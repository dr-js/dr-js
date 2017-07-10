const nodeModulePath = require('path')
const Dr = require('../Dr.node')

console.log(Object.keys(Dr))
console.log(Object.keys(Dr.Node))

const {
  createServer,
  applyResponseReducerList,
  ResponseReducer: {
    createResponseReducerParseURL,
    createRouterMapBuilder,
    createResponseReducerRouter,
    createResponseReducerServeStatic,
    createResponseReducerServeStaticSingleCached
  },
  WebSocket: {
    WEB_SOCKET_EVENT_MAP,
    DATA_TYPE_MAP,
    enableWebSocketServer
  }
} = Dr.Node.Server

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)

const responseReducerServeStatic = createResponseReducerServeStatic({ staticRoot: fromPath('../') })
const responseReducerServeFavicon = createResponseReducerServeStaticSingleCached({ staticFilePath: fromPath('../browser/favicon.ico') })

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/favicon', 'GET', responseReducerServeFavicon)
routerMapBuilder.addRoute('/favicon.ico', 'GET', responseReducerServeFavicon)
routerMapBuilder.addRoute('/static/*', 'GET', (store) => {
  store.setState({ filePath: store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ] })
  return responseReducerServeStatic(store)
})

const { server, start } = createServer({ port: 3000 }, 'HTTP')

applyResponseReducerList(server, [
  createResponseReducerParseURL(),
  createResponseReducerRouter(routerMapBuilder.getRouterMap())
])

enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
    console.log('[ON_UPGRADE_REQUEST]', request.headers, bodyHeadBuffer.length)
    const { key, version, origin, protocolList, isSecure } = webSocket
    webSocket.protocol = protocolList[ 0 ]
    console.log({ key, version, origin, protocolList, isSecure, bodyHeadBuffer })
  }
})

server.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
  console.log(`WEB_SOCKET_EVENT_MAP.OPEN`)
})

server.on(WEB_SOCKET_EVENT_MAP.FRAME, (websocket, { dataType, dataBuffer }) => {
  console.log(`WEB_SOCKET_EVENT_MAP.FRAME`, dataType, dataBuffer.length)
  // send back
  dataType === DATA_TYPE_MAP.OPCODE_TEXT && websocket.sendText(dataBuffer.toString())
  dataType === DATA_TYPE_MAP.OPCODE_BINARY && websocket.sendBuffer(dataBuffer)
})

server.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
  console.log(`WEB_SOCKET_EVENT_MAP.CLOSE`)
})

start()
