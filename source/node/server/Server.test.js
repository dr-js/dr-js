import { deepEqual, strictEqual } from 'assert'
import { fetch } from 'source/node/net'
import { createServer, createRequestListener, getUnusedPort } from './Server'
import { responderSendBuffer, responderSendJSON, createResponderParseURL } from './Responder/Common'
import { createRouteMap, createResponderRouter, getRouteParamAny, getRouteParam } from './Responder/Router'

const { describe, it } = global

describe('Node.Server.Server', () => {
  it('createServer()', async () => {
    const { server, start, stop, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: await getUnusedPort() })

    server.on('request', createRequestListener({
      responderList: [
        createResponderParseURL(option),
        createResponderRouter(createRouteMap([
          [ '/test-param/:param-a', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParam(store, 'param-a') } }) ],
          [ '/test-param-any/*', 'GET', (store) => responderSendJSON(store, { object: { param: getRouteParamAny(store) } }) ],
          [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: Buffer.from('TEST BUFFER') }) ],
          [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ]
        ]))
      ]
    }))

    start()

    deepEqual(
      await fetch(`${option.baseUrl}/test-param/AAA`).then((response) => response.json()),
      { param: 'AAA' }
    )

    deepEqual(
      await fetch(`${option.baseUrl}/test-param-any/aaa/bbb/ccc`).then((response) => response.json()),
      { param: 'aaa/bbb/ccc' }
    )

    deepEqual(
      await fetch(`${option.baseUrl}/test-buffer`).then((response) => response.text()),
      'TEST BUFFER'
    )

    deepEqual(
      await fetch(`${option.baseUrl}/test-json`).then((response) => response.json()),
      { testKey: 'testValue' }
    )

    stop()
  })

  it('getUnusedPort() single', async () => {
    const port = await getUnusedPort()

    strictEqual(typeof (port), 'number')
  })

  it('getUnusedPort() multiple', async () => {
    const portList = await Promise.all([
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort(),
      getUnusedPort()
    ])

    strictEqual(portList.length, new Set(portList).size)
  })

  it('getUnusedPort() check', async () => {
    const port = await getUnusedPort()

    const { start, stop } = createServer({ protocol: 'http:', hostname: '0.0.0.0', port })
    start()

    await getUnusedPort(port, '0.0.0.0').then(
      () => { throw new Error('should throw port token error') },
      (error) => `good, expected Error: ${error}`
    )

    stop()
  })
})
