const { WEBSOCKET_EVENT } = require('../../output-gitignore/library/node/server/WebSocket/function')
const { createWebSocketClient } = require('../../output-gitignore/library/node/server/WebSocket/WebSocketClient')

const BIG_STRING = '0123456789abcdef'.repeat(1024)
const BIG_BUFFER = Buffer.allocUnsafe(1024 * 1024)

createWebSocketClient({
  urlString: 'ws://localhost:3000',
  option: { requestProtocolString: [ 'json', 'a', 'b' ].join(',') },
  onUpgradeResponse: (webSocket, response, bodyHeadBuffer) => {
    // return webSocket.doCloseSocket() // can just close here

    const { origin, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEBSOCKET_EVENT.OPEN, () => {
      console.log(`>> OPEN`)
      webSocket.sendText('WebSocketClient open message: 123ABC!@#')
      setTimeout(async () => webSocket.sendText(BIG_STRING), 1000) // big string
      setTimeout(async () => webSocket.sendBuffer(BIG_BUFFER), 2000) // big buffer
      setTimeout(() => webSocket.close(1000, 'CLOSE RECEIVED'), 3000) // close
    })
    webSocket.on(WEBSOCKET_EVENT.FRAME, ({ dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))
    })
    webSocket.on(WEBSOCKET_EVENT.CLOSE, () => {
      console.log(`>> CLOSE`)
    })
  },
  onError: (error) => {
    console.warn('[createWebSocketClient][Error]', error)
    console.warn('[createWebSocketClient] start "example-server.js" first?')
  }
})
