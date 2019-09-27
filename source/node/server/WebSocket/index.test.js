import { strictEqual, stringifyEqual } from 'source/common/verify'
import { getUnusedPort } from 'source/node/server/function'
import { createServerPack } from 'source/node/server/Server'
import { OPCODE_TYPE, WEBSOCKET_EVENT } from './function'
import { enableWebSocketServer } from './WebSocketServer'
import { createWebSocketClient } from './WebSocketClient'

const { describe, it } = global

const TEST_PROTOCOL_LIST = [ 'protocol-a', 'protocol-b' ]
const TEST_STRING = 'TEST STRING'
const TEST_BUFFER = Buffer.allocUnsafe(8 * 1024 * 1024)

describe('Node.Server.WebSocket', () => {
  it('enableWebSocketServer + createWebSocketClient', async () => {
    const serverHostname = '127.0.0.1'
    const serverPort = await getUnusedPort()

    const { server, start, stop } = createServerPack({ protocol: 'http:', hostname: serverHostname, port: serverPort })
    const webSocketSet = enableWebSocketServer({
      server,
      onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
        const { origin, protocolList, isSecure } = webSocket
        __DEV__ && console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)
        __DEV__ && webSocket.on(WEBSOCKET_EVENT.OPEN, () => { console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`) })
        __DEV__ && webSocket.on(WEBSOCKET_EVENT.CLOSE, () => { console.log(`>> CLOSE, current active: ${webSocketSet.size} (self included)`) })
        stringifyEqual(webSocket.protocolList, TEST_PROTOCOL_LIST)
        webSocket.on(WEBSOCKET_EVENT.FRAME, async ({ dataType, dataBuffer }) => {
          // console.log(`>> FRAME:`, dataType, dataBuffer.length, String(dataBuffer).slice(0, 20))
          if (dataType === OPCODE_TYPE.TEXT && String(dataBuffer) === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
          dataType === OPCODE_TYPE.TEXT && webSocket.sendText(String(dataBuffer))
          dataType === OPCODE_TYPE.BINARY && webSocket.sendBuffer(dataBuffer)
        })
        return webSocket.protocolList[ 0 ]
      }
    })

    await start()

    const webSocket = await new Promise((resolve, reject) => createWebSocketClient({
      urlString: `ws://${serverHostname}:${serverPort}`,
      option: { requestProtocolString: TEST_PROTOCOL_LIST.join(',') },
      onUpgradeResponse: (webSocket, response, bodyHeadBuffer) => {
        webSocket.on(WEBSOCKET_EVENT.OPEN, () => resolve(webSocket))
        setTimeout(() => reject(new Error('[onUpgradeResponse] timeout')), 500)
      },
      onError: reject
    }))
    const getNextFrame = () => new Promise((resolve, reject) => {
      webSocket.on(WEBSOCKET_EVENT.FRAME, ({ dataType, dataBuffer }) => resolve({ dataType, dataBuffer }))
      setTimeout(() => reject(new Error('[getNextFrame] timeout')), 2500)
    })

    strictEqual(webSocketSet.size, 1)

    // console.log(`>> OPEN`)

    {
      webSocket.sendText(TEST_STRING) // big string
      const { dataType, dataBuffer } = await getNextFrame()
      strictEqual(dataType, OPCODE_TYPE.TEXT)
      strictEqual(String(dataBuffer), TEST_STRING)
    }

    {
      webSocket.sendBuffer(TEST_BUFFER) // big buffer
      const { dataType, dataBuffer } = await getNextFrame()
      strictEqual(dataType, OPCODE_TYPE.BINARY)
      strictEqual(dataBuffer.size, TEST_BUFFER.size)
    }

    webSocket.close(1000, 'CLOSE') // close

    await new Promise((resolve, reject) => {
      webSocket.on(WEBSOCKET_EVENT.CLOSE, resolve)
      setTimeout(reject, 500)
    })

    await stop()
  })
})
