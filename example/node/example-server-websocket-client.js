// const { setTimeoutAsync } = require('../../output-gitignore/library/common/time.js')
const { createWSClient } = require('../../output-gitignore/library/node/server/WS/Client.js')

const BIG_STRING = '0123456789abcdef'.repeat(1024)
const BIG_BUFFER = Buffer.allocUnsafe(1024 * 1024)

createWSClient('ws://127.0.0.1:3000', { protocolList: [ 'json', 'a', 'b' ] })
  .then(async (ws) => {
    console.log('>> OPEN')
    await Promise.all([
      (async () => {
        await ws.sendText('WebSocketClient open message: 123ABC!@#')
        await ws.sendText('BIG STRING') // big string request
        await ws.sendText('BIG BUFFER') // big buffer request

        await ws.sendText(BIG_STRING) // big string echo
        await ws.sendBinary(BIG_BUFFER) // big buffer echo

        await ws.sendText('CLOSE') // close text
        // await setTimeoutAsync(0) // or the close will be too fast for last buffer echo
        // await ws.close(1000, 'CLOSE RECEIVED') // direct close
      })(),
      (async () => {
        for await (const { opcode, buffer } of ws) {
          console.log('>> FRAME:', opcode, buffer.length, String(buffer).slice(0, 20))
        }
      })()
    ])
    console.log('>> CLOSE')
  })
  .catch((error) => {
    console.warn('[createWSClient][Error]', error)
    console.warn('[createWSClient] start "example-server.js" first?')
    process.exitCode = 1
  })
