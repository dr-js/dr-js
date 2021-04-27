import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { fetchLikeRequest } from 'source/node/net.js'
import { bufferToReadableStream } from 'source/node/data/Stream.js'
import { createServerExot, createRequestListener } from './Server.js'
import { getUnusedPort } from './function.js'
import {
  responderSendBuffer,
  responderSendBufferRange,
  responderSendBufferCompress,
  responderSendStream,
  responderSendStreamRange,
  responderSendStreamCompress,
  responderSendJSON
} from './Responder/Send.js'
import { createRouteMap, createResponderRouter, getRouteParamAny, getRouteParam } from './Responder/Router.js'

const { describe, it } = global

const TEST_BUFFER_TEXT = 'TEST BUFFER!'.repeat(32)
const TEST_BUFFER = Buffer.from(TEST_BUFFER_TEXT)
const TEST_BUFFER_ZERO_TEXT = ''
const TEST_BUFFER_ZERO = Buffer.from(TEST_BUFFER_ZERO_TEXT)

describe('Node.Server.Server', () => {
  it('createServerExot()', async () => {
    const { up, down, server, option: { baseUrl } } = createServerExot({ protocol: 'http:', hostname: '127.0.0.1', port: await getUnusedPort() })

    server.on('request', createRequestListener({
      responderList: [
        createResponderRouter({
          routeMap: createRouteMap([
            [ '/test-param/:param-a', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParam(store, 'param-a') } }) ],
            [ '/test-param-any/*', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParamAny(store) } }) ],

            [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: TEST_BUFFER }) ],
            [ '/test-buffer-zero', 'GET', (store) => responderSendBuffer(store, { buffer: TEST_BUFFER_ZERO }) ],
            [ '/test-buffer-range', 'GET', (store) => responderSendBufferRange(store, { buffer: TEST_BUFFER }, [ 4, 8 ]) ],
            [ '/test-buffer-range-zero', 'GET', (store) => responderSendBufferRange(store, { buffer: TEST_BUFFER }, [ 8, 8 ]) ],
            [ '/test-buffer-gzip', 'GET', (store) => responderSendBufferCompress(store, { buffer: TEST_BUFFER }) ],
            [ '/test-buffer-gzip-zero', 'GET', (store) => responderSendBufferCompress(store, { buffer: TEST_BUFFER_ZERO }) ],

            [ '/test-stream', 'GET', (store) => responderSendStream(store, { stream: bufferToReadableStream(TEST_BUFFER), length: TEST_BUFFER.length }) ],
            [ '/test-stream-zero', 'GET', (store) => responderSendStream(store, { stream: bufferToReadableStream(TEST_BUFFER_ZERO), length: TEST_BUFFER_ZERO.length }) ],
            [ '/test-stream-range', 'GET', (store) => responderSendStreamRange(store, { streamRange: bufferToReadableStream(TEST_BUFFER.slice(4, 8 + 1)), length: TEST_BUFFER.length }, [ 4, 8 ]) ],
            [ '/test-stream-range-zero', 'GET', (store) => responderSendStreamRange(store, { streamRange: bufferToReadableStream(TEST_BUFFER.slice(8, 8 + 1)), length: TEST_BUFFER.length }, [ 8, 8 ]) ],
            [ '/test-stream-gzip', 'GET', (store) => responderSendStreamCompress(store, { stream: bufferToReadableStream(TEST_BUFFER), length: TEST_BUFFER.length }) ],
            [ '/test-stream-gzip-zero', 'GET', (store) => responderSendStreamCompress(store, { stream: bufferToReadableStream(TEST_BUFFER_ZERO), length: TEST_BUFFER_ZERO.length }) ],

            [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ]
          ]),
          baseUrl
        })
      ]
    }))

    await up()

    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-param/AAA`)).json(),
      { param: 'AAA' },
      'fetch /test-param/AAA'
    )

    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-param-any/aaa/bbb/ccc`)).json(),
      { param: 'aaa/bbb/ccc' },
      'fetch /test-param-any/aaa/bbb/ccc'
    )

    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`)).text(),
      TEST_BUFFER_TEXT,
      'fetch /test-buffer'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer-zero`)).text(),
      TEST_BUFFER_ZERO_TEXT,
      'fetch /test-buffer-zero'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer-range`)).text(),
      String(TEST_BUFFER.slice(4, 8 + 1)),
      'fetch /test-buffer-range'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer-range-zero`)).text(),
      String(TEST_BUFFER.slice(8, 8 + 1)),
      'fetch /test-buffer-range-zero'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer-gzip`)).text(),
      TEST_BUFFER_TEXT,
      'fetch /test-buffer-gzip'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer-gzip-zero`)).text(),
      TEST_BUFFER_ZERO_TEXT,
      'fetch /test-buffer-gzip-zero'
    )

    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream`)).text(),
      TEST_BUFFER_TEXT,
      'fetch /test-stream'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream-zero`)).text(),
      TEST_BUFFER_ZERO_TEXT,
      'fetch /test-stream-zero'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream-range`)).text(),
      String(TEST_BUFFER.slice(4, 8 + 1)),
      'fetch /test-stream-range'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream-range-zero`)).text(),
      String(TEST_BUFFER.slice(8, 8 + 1)),
      'fetch /test-stream-range-zero'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream-gzip`)).text(),
      TEST_BUFFER_TEXT,
      'fetch /test-stream-gzip'
    )
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-stream-gzip-zero`)).text(),
      TEST_BUFFER_ZERO_TEXT,
      'fetch /test-stream-gzip-zero'
    )

    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-json`)).json(),
      { testKey: 'testValue' },
      'fetch /test-json'
    )

    await down()
  })
})
