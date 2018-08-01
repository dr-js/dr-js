import { deepStrictEqual, strictEqual } from 'assert'
import { fetch } from 'source/node/net'
import { bufferToStream } from 'source/node/data/Stream'
import { createServer, createRequestListener } from './Server'
import { getUnusedPort } from './function'
import { createResponderParseURL } from './Responder/Common'
import {
  responderSendBuffer,
  responderSendBufferRange,
  responderSendBufferCompress,
  responderSendStream,
  responderSendStreamRange,
  responderSendStreamCompress,
  responderSendJSON
} from './Responder/Send'
import { createRouteMap, createResponderRouter, getRouteParamAny, getRouteParam } from './Responder/Router'

const { describe, it } = global

const TEST_BUFFER_TEXT = 'TEST BUFFER!'.repeat(32)
const TEST_BUFFER = Buffer.from(TEST_BUFFER_TEXT)

describe('Node.Server.Server', () => {
  it('createServer()', async () => {
    const { server, start, stop, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: await getUnusedPort() })

    server.on('request', createRequestListener({
      responderList: [
        createResponderParseURL(option),
        createResponderRouter(createRouteMap([
          [ '/test-param/:param-a', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParam(store, 'param-a') } }) ],
          [ '/test-param-any/*', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParamAny(store) } }) ],

          [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: TEST_BUFFER }) ],
          [ '/test-buffer-range', 'GET', (store) => responderSendBufferRange(store, { buffer: TEST_BUFFER }, [ 4, 8 ]) ],
          [ '/test-buffer-gzip', 'GET', (store) => responderSendBufferCompress(store, { buffer: TEST_BUFFER }) ],

          [ '/test-stream', 'GET', (store) => responderSendStream(store, { stream: bufferToStream(TEST_BUFFER), length: TEST_BUFFER.length }) ],
          [ '/test-stream-range', 'GET', (store) => responderSendStreamRange(store, { streamRange: bufferToStream(TEST_BUFFER.slice(4, 8 + 1)), length: TEST_BUFFER.length }, [ 4, 8 ]) ],
          [ '/test-stream-gzip', 'GET', (store) => responderSendStreamCompress(store, { stream: bufferToStream(TEST_BUFFER), length: TEST_BUFFER.length }) ],

          [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ]
        ]))
      ]
    }))

    start()

    deepStrictEqual(
      await fetch(`${option.baseUrl}/test-param/AAA`).then((response) => response.json()),
      { param: 'AAA' },
      'fetch /test-param/AAA'
    )

    deepStrictEqual(
      await fetch(`${option.baseUrl}/test-param-any/aaa/bbb/ccc`).then((response) => response.json()),
      { param: 'aaa/bbb/ccc' },
      'fetch /test-param-any/aaa/bbb/ccc'
    )

    strictEqual(
      await fetch(`${option.baseUrl}/test-buffer`).then((response) => response.text()),
      TEST_BUFFER_TEXT,
      'fetch /test-buffer'
    )
    strictEqual(
      await fetch(`${option.baseUrl}/test-buffer-range`).then((response) => response.text()),
      TEST_BUFFER.slice(4, 8 + 1).toString(),
      'fetch /test-buffer-range'
    )
    strictEqual(
      await fetch(`${option.baseUrl}/test-buffer-gzip`).then((response) => response.text()),
      TEST_BUFFER_TEXT,
      'fetch /test-buffer-gzip'
    )

    strictEqual(
      await fetch(`${option.baseUrl}/test-stream`).then((response) => response.text()),
      TEST_BUFFER_TEXT,
      'fetch /test-stream'
    )
    strictEqual(
      await fetch(`${option.baseUrl}/test-stream-range`).then((response) => response.text()),
      TEST_BUFFER.slice(4, 8 + 1).toString(),
      'fetch /test-stream-range'
    )
    strictEqual(
      await fetch(`${option.baseUrl}/test-stream-gzip`).then((response) => response.text()),
      TEST_BUFFER_TEXT,
      'fetch /test-stream-gzip'
    )

    deepStrictEqual(
      await fetch(`${option.baseUrl}/test-json`).then((response) => response.json()),
      { testKey: 'testValue' },
      'fetch /test-json'
    )

    stop()
  })
})
