import { stringifyEqual, strictEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer'
import { fetchLikeRequest } from './net'

const { describe, it, info = console.log } = global

// TODO: NOTE: this test depend on the server from `script/testBrowser.js`

const baseUrl = '' // use current origin

const expectError = (content) => (error) => {
  if (String(error).includes(content)) info(`good, expected: ${error}`)
  else throw new Error(`unexpected: ${error.stack || error}`)
}

describe('Browser.Net', () => {
  it('fetchLikeRequest() status', async () => {
    await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 500 }).then(
      ({ status }) => { if (status !== 200) throw new Error(`unexpected status: ${status}`) }
    )
    await fetchLikeRequest(`${baseUrl}/test-status-418`, { timeout: 500 }).then(
      ({ status }) => { if (status !== 418) throw new Error(`unexpected status: ${status}`) }
    )
  })

  it('fetchLikeRequest() option: timeout', async () => {
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 10 }).then(
      () => { throw new Error('should throw time out error') },
      expectError('NETWORK_TIMEOUT')
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 50 }).then(
      () => { throw new Error('should throw time out error') },
      expectError('NETWORK_TIMEOUT')
    )
    await fetchLikeRequest(`${baseUrl}/test-timeout`, { timeout: 80 }) // should pass
    await fetchLikeRequest(`${baseUrl}/test-timeout-payload`, { timeout: 80 }).then(
      (response) => response.arrayBuffer(),
      (error) => { throw new Error(`should not timeout: ${error}`) }
    ).then(
      (arrayBuffer) => {
        console.log(`arrayBuffer: ${arrayBuffer}`, arrayBuffer.byteLength)
        throw new Error('should throw time out error')
      },
      expectError('PAYLOAD_TIMEOUT')
    )
  })

  it('fetchLikeRequest(): arrayBuffer(), text(), json()', async () => {
    strictEqual(isEqualArrayBuffer(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).arrayBuffer(),
      new TextEncoder().encode('TEST BUFFER').buffer
    ), true)
    strictEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })).text(),
      'TEST BUFFER'
    )
    stringifyEqual(
      await (await fetchLikeRequest(`${baseUrl}/test-json`, { timeout: 50 })).json(),
      { testKey: 'testValue' }
    )
  })

  it('fetchLikeRequest() should not allow receive response data multiple times', async () => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    const payloadPromise0 = response.arrayBuffer()
    const payloadPromise1 = response.arrayBuffer().catch(() => 'error')
    const payloadPromise2 = response.text().catch(() => 'error')
    strictEqual(isEqualArrayBuffer(await payloadPromise0, new TextEncoder().encode('TEST BUFFER').buffer), true)
    strictEqual(await payloadPromise1, 'error') // again
    strictEqual(await payloadPromise2, 'error') // and again
  })

  it('fetchLikeRequest() unreceived response should clear up on next tick and throw when try to access', async () => {
    const response = await fetchLikeRequest(`${baseUrl}/test-buffer`, { timeout: 50 })
    await setTimeoutAsync(0)
    await response.arrayBuffer().then(
      () => { throw new Error('should throw data already dropped error') },
      expectError('PAYLOAD_ALREADY_DROPPED')
    )
  })
})
