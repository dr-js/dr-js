const { resolve } = require('path')
const { readFileAsync } = require('../../output-gitignore/library/node/file/function')
const { WEB_SOCKET_EVENT_MAP } = require('../../output-gitignore/library/node/server/WebSocket/type')
const { createWebSocketClient } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketClient')

const fromPath = (...args) => resolve(__dirname, ...args)

createWebSocketClient({
  urlString: 'ws://localhost:3000',
  option: { requestProtocolString: [ 'json', 'a', 'b' ].join(',') },
  onUpgradeResponse: (webSocket, response, bodyHeadBuffer) => {
    // return webSocket.doCloseSocket() // can just close here

    const { origin, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
      console.log(`>> OPEN`)
      webSocket.sendText('WebSocketClient open message: 123ABC!@#')
      setTimeout(async () => webSocket.sendText(await readFileAsync(fromPath('../resource/favicon.ico'), 'utf8')), 1000) // big string
      setTimeout(async () => webSocket.sendBuffer(await readFileAsync(fromPath('../resource/favicon.ico'))), 2000) // big buffer
      setTimeout(() => webSocket.close(1000, 'CLOSE RECEIVED'), 3000) // close
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, ({ dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      console.log(`>> CLOSE`)
    })
  },
  onError: (error) => {
    console.warn('[createWebSocketClient][Error]', error)
    console.warn('[createWebSocketClient] start "example-server.js" first?')
  }
})
