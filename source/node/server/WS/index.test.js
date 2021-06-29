import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { createInsideOutPromise } from 'source/common/function.js'
import { getUnusedPort } from 'source/node/server/function.js'
import { createServerExot } from 'source/node/server/Server.js'
import { OPCODE_TYPE } from './function.js'
import { createWSClient } from './Client.js'
import { enableWSServer } from './Server.js'

const { describe, it } = globalThis

const TEST_PROTOCOL_LIST = [ 'protocol-a', 'protocol-b' ]
const TEST_STRING = 'TEST STRING'
const TEST_BUFFER = Buffer.allocUnsafe(8 * 1024 * 1024)

describe('Node.Server.WS', () => {
  it('enableWSServer + createWSClient', async () => {
    const IOP = createInsideOutPromise()

    const serverHostname = '127.0.0.1'
    const serverPort = await getUnusedPort()

    const serverExot = createServerExot({ protocol: 'http:', hostname: serverHostname, port: serverPort })
    const wsSet = enableWSServer(serverExot.server, {
      onUpgradeRequest: async (request, socket, headBuffer, info) => {
        __DEV__ && console.log('[ON_UPGRADE_REQUEST]', info, headBuffer.length)
        stringifyEqual(info.protocolList, TEST_PROTOCOL_LIST)
        const ws = info.getWS(info.protocolList[ 0 ])
        for await (const { opcode, buffer } of ws) {
          console.log('>> Server FRAME:', opcode, buffer.length, String(buffer).slice(0, 20))
          if (!ws.getIsOpen()) continue // should drop frame after close, the for await loop is not safe OPEN guarantee
          if (opcode === OPCODE_TYPE.TEXT && String(buffer) === 'CLOSE') await ws.close(1000, 'CLOSE RECEIVED')
          else {
            opcode === OPCODE_TYPE.TEXT && await ws.sendText(String(buffer))
            opcode === OPCODE_TYPE.BINARY && await ws.sendBinary(buffer)
          }
        }
        __DEV__ && console.log(`>> Server CLOSE, current active: ${wsSet.size} (self included)`)
      },
      onError: IOP.reject
    })
    await serverExot.up()

    const ws = await createWSClient(`ws://${serverHostname}:${serverPort}`, { protocolList: TEST_PROTOCOL_LIST })
    strictEqual(wsSet.size, 1)

    {
      const [
        ,
        { value: { opcode, buffer } }
      ] = await Promise.all([
        ws.sendText(TEST_STRING), // big string
        ws.next()
      ])
      strictEqual(opcode, OPCODE_TYPE.TEXT)
      strictEqual(String(buffer), TEST_STRING)
    }

    {
      const [
        ,
        { value: { opcode, buffer } }
      ] = await Promise.all([
        ws.sendBinary(TEST_BUFFER), // big buffer
        ws.next()
      ])
      strictEqual(opcode, OPCODE_TYPE.BINARY)
      strictEqual(Buffer.compare(buffer, TEST_BUFFER), 0)
    }

    ws.sendBinary(TEST_BUFFER) // TEST ONLY BAD USAGE: queue big buffer, don't await and don't receive
    ws.sendBinary(TEST_BUFFER) // TEST ONLY BAD USAGE: queue big buffer, don't await and don't receive

    ws.close(1000, 'CLOSE') // close
    await ws.promise // wait close
    strictEqual(wsSet.size, 0, 'server should also close the socket')

    await serverExot.down()

    IOP.resolve()
    await IOP.promise
  })
})
