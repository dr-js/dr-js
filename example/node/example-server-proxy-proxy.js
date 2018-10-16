const { resolve } = require('path')
const { createServer: createHttpServer } = require('http')

const { createPathPrefixLock } = require('../../output-gitignore/library/node/file/function')
const { requestAsync } = require('../../output-gitignore/library/node/net')
const { receiveBufferAsync } = require('../../output-gitignore/library/node/data/Buffer')
const { createServer, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { createResponderParseURL } = require('../../output-gitignore/library/node/server/Responder/Common')
const { createResponderFavicon } = require('../../output-gitignore/library/node/server/Responder/Send')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP } = require('../../output-gitignore/library/node/server/WebSocket/type')
const { enableWebSocketServer } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketServer')

const { createExampleServerHTMLResponder } = require('./example-server-html')

const ServerHost = 'localhost'
const ServerPort = 3000
const ProxyHost = 'localhost'
const ProxyPort = 4000

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const responderServeStatic = createResponderServeStatic({})
const responderProxy = async (store) => {
  const requestBuffer = await receiveBufferAsync(store.request)
  const proxyResponse = await requestAsync({ hostname: ProxyHost, port: ProxyPort, path: '/get-proxy' }, requestBuffer)
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  store.response.end(responseBuffer)
}

const { server, start, option } = createServer({ protocol: 'http:', hostname: ServerHost, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    (store) => { console.log(`[server] get: ${store.request.url}`) },
    createResponderParseURL(option),
    createResponderRouter(createRouteMap([
      [ '/', 'GET', createExampleServerHTMLResponder() ],
      [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
      [ '/get-proxy', 'GET', (store) => store.response.write('THE FINAL RESPONSE') ],
      [ '/get-get-proxy', 'GET', responderProxy ],
      [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
    ]))
  ]
}))

const BIG_STRING = '0123456789abcdef'.repeat(1024)
const BIG_BUFFER = Buffer.allocUnsafe(1024 * 1024)

const webSocketSet = enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
    const { origin, protocolList, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
      console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`)
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, async ({ dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))

      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG STRING') return webSocket.sendText(BIG_STRING)
      if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'BIG BUFFER') return webSocket.sendBuffer(BIG_BUFFER)

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

start().then(() => {
  console.log(`Server running at: 'http://${ServerHost}:${ServerPort}'`)
})

createHttpServer(async (originalRequest, originalResponse) => {
  console.log(`[proxy] get: ${originalRequest.url}`)
  const requestBuffer = await receiveBufferAsync(originalRequest)
  const proxyResponse = await requestAsync({
    hostname: ServerHost,
    port: ServerPort,
    path: originalRequest.url,
    method: originalRequest.method,
    headers: originalRequest.headers
  }, requestBuffer)
  const responseBuffer = await receiveBufferAsync(proxyResponse)
  Object.entries(proxyResponse.headers).forEach(([ name, value ]) => originalResponse.setHeader(name, value))
  originalResponse.statusCode = proxyResponse.statusCode
  originalResponse.statusMessage = proxyResponse.statusMessage
  originalResponse.end(responseBuffer)
}).listen(ProxyPort, ProxyHost)

console.log(`Proxy running at: 'http://${ProxyHost}:${ProxyPort}'`)
