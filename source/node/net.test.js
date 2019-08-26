import { stringifyEqual, strictEqual } from 'source/common/verify'
import { resolve } from 'path'
import { unlinkSync, writeFileSync } from 'fs'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer'
import { receiveBufferAsync, sendBufferAsync, toArrayBuffer } from 'source/node/data/Buffer'
import { getUnusedPort } from 'source/node/server/function'
import { createServer, createRequestListener } from 'source/node/server/Server'
import { responderEnd, responderEndWithStatusCode } from 'source/node/server/Responder/Common'
import { responderSendBuffer, responderSendJSON } from 'source/node/server/Responder/Send'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router'
import { setTimeoutAsync } from 'source/common/time'
import { ping, fetchLikeRequest } from './net'

const { describe, it, before, after } = global

const BUFFER_SCRIPT = Buffer.from([
  `// Simple script file, used for js test`,
  `const a = async (b = 0) => b + 1`,
  `a().then(console.log)`
].join('\n'))
const SOURCE_SCRIPT = resolve(__dirname, './test-net-script-gitignore.js')

const withTestServer = (asyncTest) => async () => {
  const { server, start, stop, option: { baseUrl } } = createServer({ protocol: 'http:', hostname: '127.0.0.1', port: await getUnusedPort() })
  let retryCount = 0
  server.on('request', createRequestListener({
    responderList: [
      createResponderRouter({
        routeMap: createRouteMap([
          [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: Buffer.from('TEST BUFFER') }) ],
          [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ],
          [ '/test-timeout', 'GET', async (store) => {
            await setTimeoutAsync(60)
            return responderEndWithStatusCode(store, { statusCode: 204 })
          } ],
          [ '/test-timeout-payload', 'GET', async (store) => {
            store.response.writeHead(200, { 'content-length': BUFFER_SCRIPT.length * 2 })
            await setTimeoutAsync(40)
            await sendBufferAsync(store.response, BUFFER_SCRIPT)
            await setTimeoutAsync(40)
            await sendBufferAsync(store.response, BUFFER_SCRIPT)
            return responderEnd(store)
          } ],
          [ '/test-retry', 'GET', async (store) => {
            retryCount++
            if ((retryCount % 4) !== 0) return store.response.destroy()
            return responderEndWithStatusCode(store, { statusCode: 200 })
          } ],
          [ '/test-script', 'GET', async (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ]
        ]),
        baseUrl
      })
    ]
  }))
  await start()
  await asyncTest(baseUrl)
  await stop()
}

before('prepare', () => {
  writeFileSync(SOURCE_SCRIPT, BUFFER_SCRIPT)
})

after('clear', () => {
  unlinkSync(SOURCE_SCRIPT)
})

describe('Node.Net', () => {
  it('fetchLikeRequest() option: timeout', withTestServer(async (baseUrl) => {
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 10 }).then(
      () => { throw new Error('should throw time out error') },
      (error) => `good, expected Error: ${error}`
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 50 }).then(
      () => { throw new Error('should throw time out error') },
      (error) => `good, expected Error: ${error}`
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 80 }).then(
      () => `good, should pass`,
      (error) => { throw new Error(`should not timeout: ${error}`) }
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout-payload`, { timeout: 40 }).then(
      (response) => response.buffer(),
      (error) => { throw new Error(`should not timeout: ${error}`) }
    ).then(
      (buffer) => {
        console.log(buffer.length, BUFFER_SCRIPT.length)
        throw new Error('should throw time out error')
      },
      (error) => `good, expected Error: ${error}`
    )
  }))

  it('fetchLikeRequest(): stream(), buffer(), arrayBuffer(), text(), json()', withTestServer(async (baseUrl) => {
    strictEqual(Buffer.compare(
      await receiveBufferAsync((await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).stream()),
      Buffer.from('TEST BUFFER')
    ), 0)
    strictEqual(Buffer.compare(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).buffer(),
      Buffer.from('TEST BUFFER')
    ), 0)
    strictEqual(isEqualArrayBuffer(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).arrayBuffer(),
      toArrayBuffer(Buffer.from('TEST BUFFER'))
    ), true)
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).text(),
      'TEST BUFFER'
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-json`, { timeout: 50 })).json(),
      { testKey: 'testValue' }
    )
  }))

  it('fetchLikeRequest() should not allow receive response data multiple times', withTestServer(async (baseUrl) => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    const bufferPromise0 = response.buffer()
    const bufferPromise1 = response.buffer().catch(() => 'error')
    const bufferPromise2 = response.text().catch(() => 'error')
    strictEqual(Buffer.compare(await bufferPromise0, Buffer.from('TEST BUFFER')), 0)
    strictEqual(await bufferPromise1, 'error') // again
    strictEqual(await bufferPromise2, 'error') // and again
  }))

  it('fetchLikeRequest() unreceived response should clear up on next tick and throw when try to access', withTestServer(async (baseUrl) => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    await setTimeoutAsync(0)
    await response.buffer().then(
      () => { throw new Error('should throw data already dropped error') },
      (error) => `good, expected Error: ${error}`
    )
  }))

  it('ping() simple test', withTestServer(async (baseUrl) => {
    await ping(`${baseUrl}/test-buffer`)
    await ping(`${baseUrl}/test-json`)
  }))

  it('ping() timeout', withTestServer(async (baseUrl) => {
    await ping(`${baseUrl}/test-buffer`, { wait: 10 })
    await ping(`${baseUrl}/test-timeout`, { wait: 50, maxRetry: 2 }).then(
      () => { throw new Error('should throw ping timeout error') },
      (error) => `good, expected Error: ${error}`
    )
  }))

  it('ping() retryCount', withTestServer(async (baseUrl) => { // total ping = 1 + retryCount
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      (error) => `good, expected Error: ${error}`
    )
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 0 }) // 4, pass
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 3 }) // 4, pass
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      (error) => `good, expected Error: ${error}`
    )
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 0 }) // 4, pass
  }))
})
