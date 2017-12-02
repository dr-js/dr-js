import nodeModuleAssert from 'assert'
import { createServer } from '../Server'
import { WEB_SOCKET_EVENT_MAP, DATA_TYPE_MAP, createWebSocketClient, enableWebSocketServer } from './index'

const { describe, it } = global

const TEST_PROTOCOL_LIST = [ 'protocol-a', 'protocol-b' ]
const TEST_STRING = 'TEST STRING'
const TEST_BUFFER = Buffer.allocUnsafe(8 * 1024 * 1024)

describe('Node.Server.WebSocket', () => {
  it('enableWebSocketServer + createWebSocketClient', async () => {
    const { server, start, stop } = createServer({ protocol: 'http:', hostname: 'localhost', port: 3000 })
    const webSocketSet = enableWebSocketServer({
      server,
      onUpgradeRequest: (webSocket, request, bodyHeadBuffer) => {
        // const { origin, protocolList, isSecure } = webSocket
        // console.log('[ON_UPGRADE_REQUEST]', { origin, protocolList, isSecure }, bodyHeadBuffer.length)
        // webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => { console.log(`>> OPEN, current active: ${webSocketSet.size} (self excluded)`) })
        // webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => { console.log(`>> CLOSE, current active: ${webSocketSet.size} (self included)`) })
        nodeModuleAssert.deepStrictEqual(webSocket.protocolList, TEST_PROTOCOL_LIST)
        webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, async (webSocket, { dataType, dataBuffer }) => {
          // console.log(`>> FRAME:`, dataType, dataBuffer.length, dataBuffer.toString().slice(0, 20))
          if (dataType === DATA_TYPE_MAP.OPCODE_TEXT && dataBuffer.toString() === 'CLOSE') return webSocket.close(1000, 'CLOSE RECEIVED')
          dataType === DATA_TYPE_MAP.OPCODE_TEXT && webSocket.sendText(dataBuffer.toString())
          dataType === DATA_TYPE_MAP.OPCODE_BINARY && webSocket.sendBuffer(dataBuffer)
        })
        return webSocket.protocolList[ 0 ]
      }
    })

    start()

    const webSocket = await new Promise((resolve, reject) => createWebSocketClient({
      urlString: 'ws://localhost:3000',
      option: { requestProtocolString: TEST_PROTOCOL_LIST.join(',') },
      onUpgradeResponse: (webSocket, response, bodyHeadBuffer) => {
        webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => resolve(webSocket))
        setTimeout(reject, 500)
      },
      onError: reject
    }))
    const getNextFrame = () => new Promise((resolve, reject) => {
      webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, (webSocket, { dataType, dataBuffer }) => resolve({ dataType, dataBuffer }))
      setTimeout(reject, 500)
    })

    nodeModuleAssert.equal(webSocketSet.size, 1)

    // console.log(`>> OPEN`)

    {
      webSocket.sendText(TEST_STRING) // big string
      const { dataType, dataBuffer } = await getNextFrame()
      nodeModuleAssert.equal(dataType, DATA_TYPE_MAP.OPCODE_TEXT)
      nodeModuleAssert.equal(dataBuffer.toString(), TEST_STRING)
    }

    {
      webSocket.sendBuffer(TEST_BUFFER) // big buffer
      const { dataType, dataBuffer } = await getNextFrame()
      nodeModuleAssert.equal(dataType, DATA_TYPE_MAP.OPCODE_BINARY)
      nodeModuleAssert.equal(dataBuffer.size, TEST_BUFFER.size)
    }

    webSocket.close(1000, 'CLOSE') // close
    await new Promise((resolve, reject) => {
      webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, resolve)
      setTimeout(reject, 500)
    })

    stop()
  })
})
