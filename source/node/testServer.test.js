import { setTimeoutAsync } from 'source/common/time'
import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { writeBufferToStreamAsync, readableStreamToBufferAsync } from 'source/node/data/Stream'
import { getUnusedPort } from 'source/node/server/function'
import { createServerExot, createRequestListener } from 'source/node/server/Server'
import { responderEnd, responderEndWithStatusCode } from 'source/node/server/Responder/Common'
import { responderSendBuffer, responderSendJSON } from 'source/node/server/Responder/Send'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router'

const bufferList = []
bufferList.length = 8 * 1024
bufferList.fill(Buffer.from([
  '// Simple script file, used for js test',
  'const a = async (b = 0) => b + 1',
  'a().then(console.log)'
].join('\n')))
const BUFFER_SCRIPT = Buffer.concat(bufferList) // the buffer size should be large enough for browser to get HEADERS_RECEIVED

const withTestServer = (asyncTest, generateTestHTMLAsync) => async () => {
  const { up, down, server, option: { baseUrl } } = createServerExot({ protocol: 'http:', hostname: '127.0.0.1', port: await getUnusedPort() })
  let retryCount = 0

  const URL_TEST_HTML = '/test-html'
  const testHTML = generateTestHTMLAsync ? await generateTestHTMLAsync(baseUrl) : ''

  server.on('request', createRequestListener({
    responderList: [
      createResponderRouter({
        routeMap: createRouteMap([
          testHTML && [ URL_TEST_HTML, 'GET', (store) => responderSendBuffer(store, { buffer: Buffer.from(testHTML), type: BASIC_EXTENSION_MAP.html }) ],

          [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: Buffer.from('TEST BUFFER') }) ],
          [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ],
          [ '/test-status-418', 'GET', async (store) => responderEndWithStatusCode(store, { statusCode: 418 }) ],
          [ '/test-timeout', 'GET', async (store) => {
            await setTimeoutAsync(60)
            return responderEndWithStatusCode(store, { statusCode: 204 })
          } ],
          [ '/test-timeout-payload', 'GET', async (store) => {
            store.response.writeHead(200, { 'content-length': BUFFER_SCRIPT.length * 64 })
            store.response.flushHeaders() // fast header but slow payload // NOTE: not work for browser testing, not flushing header in time
            await setTimeoutAsync(40)
            if (store.request.destroyed) return
            // TODO: flush more so the size is large enough for browser to get HEADERS_RECEIVED
            //   possible: https://stackoverflow.com/questions/26685554/xmlhttprequest-readystate-headers-received-waiting-for-entire-file-to-download
            await writeBufferToStreamAsync(store.response, BUFFER_SCRIPT)
            await setTimeoutAsync(50)
            if (store.request.destroyed) return
            await writeBufferToStreamAsync(store.response, BUFFER_SCRIPT)
            await setTimeoutAsync(100)
            if (store.request.destroyed) return // should not reach here
            await writeBufferToStreamAsync(store.response, BUFFER_SCRIPT)
            return responderEnd(store)
          } ],
          [ '/test-retry', 'GET', async (store) => {
            retryCount++
            if ((retryCount % 4) !== 0) return store.response.destroy()
            return responderEndWithStatusCode(store, { statusCode: 200 })
          } ],
          [ '/test-script', 'GET', async (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ],

          [ '/test-post', 'POST', async (store) => responderSendJSON(store, {
            object: {
              requestContentLength: store.request.headers[ 'content-length' ],
              size: (await readableStreamToBufferAsync(store.request)).length
            }
          }) ]
        ].filter(Boolean)),
        baseUrl
      })
    ]
  }))
  await up()
  await asyncTest(baseUrl, testHTML ? `${baseUrl}${URL_TEST_HTML}` : '')
  await down()
}

export { BUFFER_SCRIPT, withTestServer }
