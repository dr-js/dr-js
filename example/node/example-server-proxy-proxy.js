const { resolve } = require('path')
const { readFileSync } = require('fs')
const { createServer: createHttpServer } = require('http')

const { readFileAsync, createPathPrefixLock } = require('../../output-gitignore/library/node/file/function')
const { requestAsync } = require('../../output-gitignore/library/node/net')
const { receiveBufferAsync } = require('../../output-gitignore/library/node/data/Buffer')
const { createServer, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { responderSendBuffer, createResponderParseURL } = require('../../output-gitignore/library/node/server/Responder/Common')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP } = require('../../output-gitignore/library/node/server/WebSocket/type')
const { enableWebSocketServer } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketServer')

const ServerHost = 'localhost'
const ServerPort = 3000
const ProxyHost = 'localhost'
const ProxyPort = 4000

const fromPath = (...args) => resolve(__dirname, ...args)
const faviconBufferData = { buffer: readFileSync(fromPath('../resource/favicon.ico')), type: 'image/png' }
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
      [ '/favicon.ico', 'GET', (store) => responderSendBuffer(store, faviconBufferData) ],
      [ '/', 'GET', (store) => responderServeStatic(store, fromStaticRoot('/node/example-server.html')) ],
      [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
      [ '/get-proxy', 'GET', (store) => store.response.write('THE FINAL RESPONSE') ],
      [ '/get-get-proxy', 'GET', responderProxy ]
    ]))
  ]
}))
console.log(`Server running at: 'http://${ServerHost}:${ServerPort}'`)

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
