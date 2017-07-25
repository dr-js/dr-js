const nodeModuleFs = require('fs')
const Dr = require('../Dr.node')

// console.log(Object.keys(Dr))
// console.log(Object.keys(Dr.Node))

const {
  WebSocket: {
    WEB_SOCKET_EVENT_MAP,
    // DATA_TYPE_MAP,
    createWebSocketClient
  }
} = Dr.Node.Server

createWebSocketClient({
  urlString: 'ws://localhost:3000',
  option: {
    requestProtocolString: [ 'json', 'a', 'b' ].join(',')
  },
  onError: (error) => console.warn('[createWebSocketClient][Error]', error),
  onUpgradeResponse: (webSocket, response, bodyHeadBuffer) => {
    // return webSocket.doCloseSocket() // can just close here

    const { origin, isSecure } = webSocket
    console.log('[ON_UPGRADE_REQUEST]', { origin, isSecure }, bodyHeadBuffer.length)

    webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
      console.log(`>> OPEN`)
      webSocket.sendText('WebSocketClient open message: 123ABC!@#')

      setTimeout(() => { // big string
        nodeModuleFs.readFile('../Dr.node.js', 'utf8', (error, dataString) => {
          if (error) throw error
          webSocket.sendText(dataString)
        })
      }, 1000)

      setTimeout(() => { // big buffer
        nodeModuleFs.readFile('../Dr.node.js', (error, dataBuffer) => {
          if (error) throw error
          webSocket.sendBuffer(dataBuffer)
        })
      }, 2000)

      setTimeout(() => { // close
        webSocket.close(1000, 'CLOSE RECEIVED')
      }, 3000)
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, (webSocket, { dataType, dataBuffer }) => {
      console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))

      // echo back, do not use with a echo server
      // dataType === DATA_TYPE_MAP.OPCODE_TEXT && webSocket.sendText(dataBuffer.toString())
      // dataType === DATA_TYPE_MAP.OPCODE_BINARY && webSocket.sendBuffer(dataBuffer)
    })
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      console.log(`>> CLOSE`)
    })
  }
})
