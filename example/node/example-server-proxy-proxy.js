const { resolve } = require('path')
const { createServer: createHttpServer } = require('http')

const { createPathPrefixLock } = require('../../output-gitignore/library/node/fs/Path.js')
const { requestHttp } = require('../../output-gitignore/library/node/net.js')
const { readableStreamToBufferAsync } = require('../../output-gitignore/library/node/data/Stream.js')
const { createServerExot, createRequestListener } = require('../../output-gitignore/library/node/server/Server.js')
const { createResponderFavicon } = require('../../output-gitignore/library/node/server/Responder/Send.js')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router.js')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic.js')
const { createTCPProxyListener } = require('../../output-gitignore/library/node/server/Proxy.js')
const { OPCODE_TYPE } = require('../../output-gitignore/library/node/server/WS/function.js')
const { enableWSServer } = require('../../output-gitignore/library/node/server/WS/Server.js')

const { createExampleServerHTMLResponder } = require('./example-server-html.js')

const ServerHostname = '127.0.0.1'
const ServerPort = 3000
const ProxyHostname = '127.0.0.1'
const ProxyPort = 4000

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const responderServeStatic = createResponderServeStatic({})
const responderProxy = async (store) => {
  const requestBuffer = await readableStreamToBufferAsync(store.request)
  const proxyResponse = await requestHttp(`http://${ProxyHostname}:${ProxyPort}/get-proxy`, null, requestBuffer).promise
  const responseBuffer = await readableStreamToBufferAsync(proxyResponse)
  store.response.end(responseBuffer)
}

const { up, server, option } = createServerExot({ protocol: 'http:', hostname: ServerHostname, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    (store) => { console.log(`[server] get: ${store.request.url}`) },
    createResponderRouter({
      routeMap: createRouteMap([
        [ '/', 'GET', createExampleServerHTMLResponder() ],
        [ '/static/*', [ 'GET', 'HEAD' ], (store) => responderServeStatic(store, getParamFilePath(store)) ],
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

const wsSet = enableWSServer(server, {
  onUpgradeRequest: async (request, socket, headBuffer, info) => {
    console.log('[ON_UPGRADE_REQUEST]', info, headBuffer.length)
    const ws = info.getWS(info.protocolList[ 0 ])
    console.log(`>> OPEN, current active: ${wsSet.size} (self included)`)
    for await (const { opcode, buffer } of ws) {
      console.log('>> FRAME:', opcode, buffer.length, String(buffer).slice(0, 20))
      if (!ws.getIsOpen()) continue // should drop frame after close, the for await loop is not safe OPEN guarantee
      if (opcode === OPCODE_TYPE.TEXT && String(buffer) === 'CLOSE') await ws.close(1000, 'CLOSE RECEIVED')
      else if (opcode === OPCODE_TYPE.TEXT && String(buffer) === 'BIG STRING') await ws.sendText(BIG_STRING)
      else if (opcode === OPCODE_TYPE.TEXT && String(buffer) === 'BIG BUFFER') await ws.sendBinary(BIG_BUFFER)
      else { // echo back
        console.log('>> echo back:', opcode, buffer.length)
        opcode === OPCODE_TYPE.TEXT && await ws.sendText(String(buffer))
        opcode === OPCODE_TYPE.BINARY && await ws.sendBinary(buffer)
      }
    }
    console.log(`>> CLOSE, current active: ${wsSet.size} (self included)`)
  }
})

up().then(() => {
  console.log(`Server running at: 'http://${ServerHostname}:${ServerPort}'`)
})

createHttpServer()
  .on('connection', createTCPProxyListener({
    isSecure: false,
    getTargetOption: (socket) => {
      console.log(`[proxy] get: ${socket.remoteAddress}:${socket.remotePort}`)

      return { hostname: ServerHostname, port: ServerPort }
    }
  }))
  .listen(ProxyPort, ProxyHostname)

console.log(`Proxy running at: 'http://${ProxyHostname}:${ProxyPort}'`)
