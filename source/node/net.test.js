import { resolve } from 'path'
import { unlinkSync, writeFileSync, createReadStream } from 'fs'
import { setTimeoutAsync } from 'source/common/time'
import { percent } from 'source/common/format'
import { stringifyEqual, strictEqual } from 'source/common/verify'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer'
import { toArrayBuffer } from 'source/node/data/Buffer'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'
import { ping, fetchLikeRequest } from './net'
import { BUFFER_SCRIPT, withTestServer } from './testServer.test'

const { describe, it, before, after, info = console.log } = global

const SOURCE_SCRIPT = resolve(__dirname, './test-net-script-gitignore.js')

before('prepare', () => {
  writeFileSync(SOURCE_SCRIPT, BUFFER_SCRIPT)
})

after('clear', () => {
  unlinkSync(SOURCE_SCRIPT)
})

const expectError = (content) => (error) => {
  if (String(error).includes(content)) info(`good, expected: ${error}`)
  else throw new Error(`unexpected: ${error.stack || error}`)
}

describe('Node.Net', () => {
  it('fetchLikeRequest() status', withTestServer(async ({ baseUrl }) => {
    await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 500 }).then(
      ({ status }) => { if (status !== 200) throw new Error(`unexpected status: ${status}`) }
    )
    await fetchLikeRequest(`${baseUrl}/test-status-418`, { timeout: 500 }).then(
      ({ status }) => { if (status !== 418) throw new Error(`unexpected status: ${status}`) }
    )
  }))

  it('fetchLikeRequest() option: timeout', withTestServer(async ({ baseUrl }) => {
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 10 }).then(
      () => { throw new Error('should throw time out error') },
      expectError('NETWORK_TIMEOUT')
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 50 }).then(
      () => { throw new Error('should throw time out error') },
      expectError('NETWORK_TIMEOUT')
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout-payload`, { timeout: 40 }).then(
      (response) => response.buffer(),
      (error) => { throw new Error(`should not timeout: ${error}`) }
    ).then(
      (buffer) => {
        console.log(buffer.length, BUFFER_SCRIPT.length)
        throw new Error('should throw time out error')
      },
      expectError('PAYLOAD_TIMEOUT')
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 420 }) // should pass
  }))

  it('fetchLikeRequest(): stream(), buffer(), arrayBuffer(), text(), json()', withTestServer(async ({ baseUrl }) => {
    strictEqual(Buffer.compare(
      await readableStreamToBufferAsync((await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).stream()),
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

  it('fetchLikeRequest() should not allow receive response data multiple times', withTestServer(async ({ baseUrl }) => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    const payloadPromise0 = response.buffer()
    const payloadPromise1 = response.buffer().catch(() => 'error')
    const payloadPromise2 = response.text().catch(() => 'error')
    strictEqual(Buffer.compare(await payloadPromise0, Buffer.from('TEST BUFFER')), 0)
    strictEqual(await payloadPromise1, 'error') // again
    strictEqual(await payloadPromise2, 'error') // and again
  }))

  it('fetchLikeRequest() unreceived response should clear up on next tick and throw when try to access', withTestServer(async ({ baseUrl }) => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    await setTimeoutAsync(0)
    await response.buffer().then(
      () => { throw new Error('should throw data already dropped error') },
      expectError('PAYLOAD_ALREADY_DROPPED')
    )
  }))

  const onProgress = (now, total) => info(`${percent(now / total)} ${now}/${total}`)

  it('fetchLikeRequest() onProgress', withTestServer(async ({ baseUrl }) => {
    await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { onProgressDownload: onProgress })).buffer()
    await (await fetchLikeRequest(`${baseUrl}/test-json`, { onProgressDownload: onProgress })).buffer()
    await (await fetchLikeRequest(`${baseUrl}/test-script`, { onProgressDownload: onProgress })).buffer()
  }))

  it('fetchLikeRequest() post', withTestServer(async ({ baseUrl }) => {
    const BODY_STRING = '[test-post-body]'.repeat(64)
    const BODY_BUFFER = Buffer.from(BODY_STRING)
    const BODY_ARRAY_BUFFER = toArrayBuffer(Buffer.from(BODY_STRING))

    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-post`, { method: 'POST', body: BODY_STRING, onProgressUpload: onProgress })).json(),
      { requestContentLength: String(BODY_BUFFER.length), size: BODY_BUFFER.length }
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-post`, { method: 'POST', body: BODY_BUFFER, onProgressUpload: onProgress })).json(),
      { requestContentLength: String(BODY_BUFFER.length), size: BODY_BUFFER.length }
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-post`, { method: 'POST', body: BODY_ARRAY_BUFFER, onProgressUpload: onProgress })).json(),
      { requestContentLength: String(BODY_BUFFER.length), size: BODY_BUFFER.length }
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-post`, { method: 'POST', body: createReadStream(SOURCE_SCRIPT), onProgressUpload: onProgress })).json(),
      { size: BUFFER_SCRIPT.length } // chunked, no content length
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-post`, { method: 'POST', body: createReadStream(SOURCE_SCRIPT), bodyLength: BUFFER_SCRIPT.length, onProgressUpload: onProgress })).json(),
      { size: BUFFER_SCRIPT.length } // chunked, no content length
    )
  }))

  it('ping() simple test', withTestServer(async ({ baseUrl }) => {
    await ping(`${baseUrl}/test-buffer`)
    await ping(`${baseUrl}/test-json`)
  }))

  it('ping() timeout', withTestServer(async ({ baseUrl }) => {
    await ping(`${baseUrl}/test-buffer`, { wait: 10 })
    await ping(`${baseUrl}/test-timeout`, { wait: 50, maxRetry: 2 }).then(
      () => { throw new Error('should throw ping timeout error') },
      expectError('NETWORK_TIMEOUT')
    )
  }))

  it('ping() retryCount', withTestServer(async ({ baseUrl }) => { // total ping = 1 + retryCount
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      expectError('socket hang up')
    )
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 0 }) // 4, pass
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 3 }) // 4, pass
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      expectError('socket hang up')
    )
    await ping(`${baseUrl}/test-retry`, { wait: 10, maxRetry: 0 }) // 4, pass
  }))
})
