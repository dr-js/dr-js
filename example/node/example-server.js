const { resolve } = require('path')

const { createPathPrefixLock } = require('../../output-gitignore/library/node/file/Path')
const { createServerExot, createRequestListener } = require('../../output-gitignore/library/node/server/Server')
const { responderEnd, createResponderLog, createResponderLogEnd } = require('../../output-gitignore/library/node/server/Responder/Common')
const { createResponderRouter, createRouteMap, getRouteParamAny } = require('../../output-gitignore/library/node/server/Responder/Router')
const { createResponderFavicon } = require('../../output-gitignore/library/node/server/Responder/Send')
const { createResponderServeStatic } = require('../../output-gitignore/library/node/server/Responder/ServeStatic')
const { OPCODE_TYPE } = require('../../output-gitignore/library/node/server/WS/function')
const { enableWSServer } = require('../../output-gitignore/library/node/server/WS/Server')

const { createExampleServerHTMLResponder } = require('./example-server-html')

const fromPath = (...args) => resolve(__dirname, ...args)
const fromStaticRoot = createPathPrefixLock(fromPath('../'))
const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))

const ServerHostname = '127.0.0.1'
const ServerPort = 3000

const responderLogEnd = createResponderLogEnd({ log: console.log })
const responderServeStatic = createResponderServeStatic({})

const { up, server, option } = createServerExot({ protocol: 'http:', hostname: ServerHostname, port: ServerPort })
server.on('request', createRequestListener({
  responderList: [
    createResponderLog({ log: console.log }),
    createResponderRouter({
      routeMap: createRouteMap([
        [ '/', 'GET', createExampleServerHTMLResponder() ],
        [ '/static/*', [ 'GET', 'HEAD' ], (store) => responderServeStatic(store, getParamFilePath(store)) ],
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
