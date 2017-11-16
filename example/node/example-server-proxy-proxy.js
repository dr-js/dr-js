const nodeModuleHttp = require('http')
const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../Dr.node')

const {
  Resource: { receiveBufferAsync, requestAsync },
  Server: {
    createServer,
    createRequestListener,
    Responder: { createResponderParseURL, createRouterMapBuilder, createResponderRouter, createResponderServeStatic },
    WebSocket: { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP, enableWebSocketServer }
  }
} = Dr.Node

const ServerHost = 'localhost'
const ServerPort = 3000
const ProxyHost = 'localhost'
const ProxyPort = 4000

const readFileAsync = promisify(nodeModuleFs.readFile)
const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)
const faviconBuffer = nodeModuleFs.readFileSync(fromPath('../resource/favicon.ico'))
const responderServeStatic = createResponderServeStatic({ staticRoot: fromPath('../') })

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/favicon.ico', 'GET', (store) => store.response.end(faviconBuffer))
routerMapBuilder.addRoute('/get-proxy', 'GET', (store) => store.response.write('THE FINAL RESPONSE'))
routerMapBuilder.addRoute('/get-get-proxy', 'GET', async (store) => {
  const requestBuffer = await receiveBufferAsync(store.request)
  const proxyResponse = await requestAsync({ hostname: ProxyHost, port: ProxyPort, path: '/get-proxy' }, requestBuffer)
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  store.response.end(responseBuffer)
})
routerMapBuilder.addRoute('/', 'GET', (store) => {
  store.setState({ filePath: '/node/example-server.html' })
  return responderServeStatic(store)
})
routerMapBuilder.addRoute('/static/*', 'GET', (store) => {
  store.setState({ filePath: store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ] })
  return responderServeStatic(store)
})

const { server, start, option } = createServer({ protocol: 'http:', hostname: ServerHost, port: ServerPort })

server.on('request', createRequestListener({
  responderList: [
    createResponderParseURL(option),
    createResponderRouter(routerMapBuilder.getRouterMap())
  ]
}))

const webSocketSet = enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
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

nodeModuleHttp.createServer(async (originalRequest, originalResponse) => {
  console.log(`[proxy] get: ${originalRequest.url}`)
  const requestBuffer = await receiveBufferAsync(originalRequest)
  const proxyResponse = await requestAsync({ hostname: ServerHost, port: ServerPort, path: originalRequest.url }, requestBuffer)
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  originalResponse.end(responseBuffer)
}).listen(ProxyPort, ProxyHost)
console.log(`Proxy running at: 'http://${ProxyHost}:${ProxyPort}'`)
