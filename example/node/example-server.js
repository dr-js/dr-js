const { resolve } = require('path')

const { createPathPrefixLock } = require('../../output-gitignore/library/node/file/Path')
const { createServerPack, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { responderEnd, createResponderLog, createResponderLogEnd } = require('../../output-gitignore/library/node/server/Responder/Common')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderFavicon } = require('../../output-gitignore/library/node/server/Responder/Send')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { OPCODE_TYPE, WEBSOCKET_EVENT } = require('../../output-gitignore/library/node/server/WebSocket/function')
const { enableWebSocketServer } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketServer')

const { createExampleServerHTMLResponder } = require('./example-server-html')

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const ServerHostname = '127.0.0.1'
const ServerPort = 3000

const responderLogEnd = createResponderLogEnd({ log: console.log })
const responderServeStatic = createResponderServeStatic({})

const { server, start, option } = createServerPack({ protocol: 'http:', hostname: ServerHostname, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    createResponderLog({ log: console.log }),
    createResponderRouter({
      routeMap: createRouteMap([
        [ '/', 'GET', createExampleServerHTMLResponder() ],
        [ '/static/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
        [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
      ]),
      baseUrl: option.baseUrl
    })
  ],
  responderEnd: async (store) => {
    await responderEnd(store)
    await responderLogEnd(store)
  }
}))

const BIG_STRING = '0123456789abcdef'.repeat(1024)
const BIG_BUFFER = Buffer.allocUnsafe(1024 * 1024)

const webSocketSet = enableWebSocketServer({
  server,
  onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
    // return webSocket.doCloseSocket() // can just close here

    const { origin, protocolList, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEBSOCKET_EVENT.OPEN, () => {
      console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`)
    })
    webSocket.on(WEBSOCKET_EVENT.FRAME, async ({ dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, String(dataBuffer).slice(0, 20))

      if (dataType === OPCODE_TYPE.TEXT) {
        if (String(dataBuffer) === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
        if (String(dataBuffer) === 'BIG STRING') return webSocket.sendText(BIG_STRING)
        if (String(dataBuffer) === 'BIG BUFFER') return webSocket.sendBuffer(BIG_BUFFER)
      }

      // echo back
      dataType === OPCODE_TYPE.TEXT && webSocket.sendText(String(dataBuffer))
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
