import { deepEqual, strictEqual } from 'assert'
import { resolve } from 'path'
import { URL } from 'url'
import { unlinkSync, writeFileSync } from 'fs'
import { getUnusedPort } from 'source/node/server/function'
import { createServer, createRequestListener } from 'source/node/server/Server'
import { responderEndWithStatusCode, createResponderParseURL } from 'source/node/server/Responder/Common'
import { responderSendBuffer, responderSendJSON } from 'source/node/server/Responder/Send'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router'
import { setTimeoutAsync } from 'source/common/time'
import { urlToOption, fetch, ping } from './net'

const { describe, it, before, after } = global

const BUFFER_SCRIPT = Buffer.from([
  `// Simple script file, used for js test`,
  `const a = async (b = 0) => b + 1`,
  `a().then(console.log)`
].join('\n'))
const SOURCE_SCRIPT = resolve(__dirname, './test-net-script-gitignore.js')

const withTestServer = (asyncTest) => async () => {
  const { server, start, stop, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: await getUnusedPort() })
  let retryCount = 0
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouteMap([
        [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: Buffer.from('TEST BUFFER') }) ],
        [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ],
        [ '/test-timeout', 'GET', async (store) => {
          await setTimeoutAsync(60)
          return responderEndWithStatusCode(store, { statusCode: 204 })
        } ],
        [ '/test-retry', 'GET', async (store) => {
          retryCount++
          if ((retryCount % 4) !== 0) return store.response.destroy()
          return responderEndWithStatusCode(store, { statusCode: 200 })
        } ],
        [ '/test-script', 'GET', async (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ]
      ]))
    ]
  }))
  start()
  await asyncTest(option.baseUrl)
  stop()
}

before('prepare', () => {
  writeFileSync(SOURCE_SCRIPT, BUFFER_SCRIPT)
})

after('clear', () => {
  unlinkSync(SOURCE_SCRIPT)
})

describe('Node.Net', () => {
  it('urlToOption()', () => {
    const urlObject = new URL('aaa://bbb.ccc:111/ddd?eee=fff#ggg')
    const option = urlToOption(urlObject)
    strictEqual(option.port, 111)
    strictEqual(option.path, '/ddd?eee=fff')
  })

  it('fetch() option: timeout', withTestServer(async (serverUrl) => {
    await fetch(`${serverUrl}/test-timeout`, { timeout: 10 }).then(
      () => { throw new Error('should throw time out error') },
      (error) => `good, expected Error: ${error}`
    )
    await fetch(`${serverUrl}/test-timeout`, { timeout: 50 }).then(
      () => { throw new Error('should throw time out error') },
      (error) => `good, expected Error: ${error}`
    )
    await fetch(`${serverUrl}/test-timeout`, { timeout: 80 }).then(
      () => `good, should pass`,
      (error) => { throw new Error(`should not timeout: ${error}`) }
    )
  }))

  it('fetch() buffer(), text(), json()', withTestServer(async (serverUrl) => {
    strictEqual(Buffer.compare(
      await fetch(`${serverUrl}/test-buffer`, { timeout: 50 }).then((response) => response.buffer()),
      Buffer.from('TEST BUFFER')
    ), 0)
    strictEqual(
      await fetch(`${serverUrl}/test-buffer`, { timeout: 50 }).then((response) => response.text()),
      'TEST BUFFER'
    )
    deepEqual(
      await fetch(`${serverUrl}/test-json`, { timeout: 50 }).then((response) => response.json()),
      { testKey: 'testValue' }
    )

    // multi-call
    const response = await fetch(`${serverUrl}/test-buffer`, { timeout: 50 })
    const bufferPromise0 = response.buffer()
    const bufferPromise1 = response.buffer()
    strictEqual(Buffer.compare(await bufferPromise0, Buffer.from('TEST BUFFER')), 0)
    strictEqual(Buffer.compare(await bufferPromise1, Buffer.from('TEST BUFFER')), 0) // again
    strictEqual(await response.text(), 'TEST BUFFER')
  }))

  it('fetch() should allow receive response data multiple times (cached)', withTestServer(async (serverUrl) => {
    const response = await fetch(`${serverUrl}/test-buffer`, { timeout: 50 })
    strictEqual(Buffer.compare(await response.buffer(), Buffer.from('TEST BUFFER')), 0)
    strictEqual(Buffer.compare(await response.buffer(), Buffer.from('TEST BUFFER')), 0)
    await setTimeoutAsync(0)
    strictEqual(Buffer.compare(await response.buffer(), Buffer.from('TEST BUFFER')), 0)
    strictEqual(await response.text(), 'TEST BUFFER')
  }))

  it('fetch() unreceived response should clear up on next tick and throw when try to access', withTestServer(async (serverUrl) => {
    const response = await fetch(`${serverUrl}/test-buffer`, { timeout: 50 })
    await setTimeoutAsync(0)
    await response.buffer().then(
      () => { throw new Error('should throw data already dropped error') },
      (error) => `good, expected Error: ${error}`
    )
  }))

  it('ping() simple test', withTestServer(async (serverUrl) => {
    await ping({ url: `${serverUrl}/test-buffer` })
    await ping({ url: `${serverUrl}/test-json` })
  }))

  it('ping() timeout', withTestServer(async (serverUrl) => {
    await ping({ url: `${serverUrl}/test-buffer`, wait: 10 })
    await ping({ url: `${serverUrl}/test-timeout`, wait: 50, maxRetry: 2 }).then(
      () => { throw new Error('should throw ping timeout error') },
      (error) => `good, expected Error: ${error}`
    )
  }))

  it('ping() retryCount', withTestServer(async (serverUrl) => { // total ping = 1 + retryCount
    await ping({ url: `${serverUrl}/test-retry`, wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      (error) => `good, expected Error: ${error}`
    )
    await ping({ url: `${serverUrl}/test-retry`, wait: 10, maxRetry: 0 }) // 4, pass
    await ping({ url: `${serverUrl}/test-retry`, wait: 10, maxRetry: 3 }) // 4, pass
    await ping({ url: `${serverUrl}/test-retry`, wait: 10, maxRetry: 2 }).then(
      () => { throw new Error('should throw retry error') },
      (error) => `good, expected Error: ${error}`
    )
    await ping({ url: `${serverUrl}/test-retry`, wait: 10, maxRetry: 0 }) // 4, pass
  }))
})
