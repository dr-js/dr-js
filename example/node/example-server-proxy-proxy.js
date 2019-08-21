const { resolve } = require('path')
const { createServer: createHttpServer } = require('http')

const { createPathPrefixLock } = require('../../output-gitignore/library/node/file/Path')
const { requestAsync } = require('../../output-gitignore/library/node/net')
const { receiveBufferAsync } = require('../../output-gitignore/library/node/data/Buffer')
const { createServer, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { createResponderFavicon } = require('../../output-gitignore/library/node/server/Responder/Send')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { OPCODE_TYPE, WEBSOCKET_EVENT } = require('../../output-gitignore/library/node/server/WebSocket/function')
const { enableWebSocketServer } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketServer')

const { createExampleServerHTMLResponder } = require('./example-server-html')

const ServerHostname = 'localhost'
const ServerPort = 3000
const ProxyHostname = 'localhost'
const ProxyPort = 4000

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const responderServeStatic = createResponderServeStatic({})
const responderProxy = async (store) => {
  const requestBuffer = await receiveBufferAsync(store.request)
  const proxyResponse = await requestAsync(`http://${ProxyHostname}:${ProxyPort}/get-proxy`, null, requestBuffer)
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  store.response.end(responseBuffer)
}

const { server, start, option } = createServer({ protocol: 'http:', hostname: ServerHostname, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    (store) => { console.log(`[server] get: ${store.request.url}`) },
    createResponderRouter({
      routeMap: createRouteMap([
        [ '/', 'GET', createExampleServerHTMLResponder() ],
        [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
        [ '/get-proxy', 'GET', (store) => store.response.write('THE FINAL RESPONSE') ],
        [ '/get-get-proxy', 'GET', responderProxy ],
        [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
      ]),
      baseUrl: option.baseUrl
    })
  ]
}))

const BIG_STRING = '0123456789abcdef'.repeat(1024)
const BIG_BUFFER = Buffer.allocUnsafe(1024 * 1024)

const webSocketSet = enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
    const { origin, protocolList, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEBSOCKET_EVENT.OPEN, () => {
      console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`)
    })
    webSocket.on(WEBSOCKET_EVENT.FRAME, async ({ dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))

      if (dataType === OPCODE_TYPE.TEXT && dataBuffer.toString() === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
      if (dataType === OPCODE_TYPE.TEXT && dataBuffer.toString() === 'BIG STRING') return webSocket.sendText(BIG_STRING)
      if (dataType === OPCODE_TYPE.TEXT && dataBuffer.toString() === 'BIG BUFFER') return webSocket.sendBuffer(BIG_BUFFER)

      // echo back
      dataType === OPCODE_TYPE.TEXT && webSocket.sendText(dataBuffer.toString())
      dataType === OPCODE_TYPE.BINARY && webSocket.sendBuffer(dataBuffer)
    })
    webSocket.on(WEBSOCKET_EVENT.CLOSE, () => {
      console.log(`>> CLOSE, current active: ${webSocketSet.size} (self included)`)
    })

    return protocolList[ 0 ]
  }
})

start().then(() => {
  console.log(`Server running at: 'http://${ServerHostname}:${ServerPort}'`)
})

createHttpServer(async (originalRequest, originalResponse) => {
  console.log(`[proxy] get: ${originalRequest.url}`)
  const requestBuffer = await receiveBufferAsync(originalRequest)
  const proxyResponse = await requestAsync(
    `http://${ServerHostname}:${ServerPort}${originalRequest.url}`,
    { method: originalRequest.method, headers: originalRequest.headers },
    requestBuffer
  )
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  Object.entries(proxyResponse.headers).forEach(([ name, value ]) => originalResponse.setHeader(name, value))
  originalResponse.statusCode = proxyResponse.statusCode
  originalResponse.statusMessage = proxyResponse.statusMessage
  originalResponse.end(responseBuffer)
}).listen(ProxyPort, ProxyHostname)

console.log(`Proxy running at: 'http://${ProxyHostname}:${ProxyPort}'`)
