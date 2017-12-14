import nodeModuleAssert from 'assert'
import { fetch } from '../resource'
import { createServer, createRequestListener } from './Server'
import {
  responderSendBuffer,
  responderSendJSON,
  createResponderParseURL,
  createRouteMap,
  createResponderRouter,
  getRouteParamAny,
  getRouteParam
} from './Responder'

const { describe, it } = global

describe('Node.Server.Server', () => {
  it('createServer()', async () => {
    const { server, start, stop, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: 12345 })

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

    nodeModuleAssert.deepEqual(
      await fetch(`${option.baseUrl}/test-param/AAA`).then((response) => response.json()),
      { param: 'AAA' }
    )

    nodeModuleAssert.deepEqual(
      await fetch(`${option.baseUrl}/test-param-any/aaa/bbb/ccc`).then((response) => response.json()),
      { param: 'aaa/bbb/ccc' }
    )

    nodeModuleAssert.deepEqual(
      await fetch(`${option.baseUrl}/test-buffer`).then((response) => response.text()),
      'TEST BUFFER'
    )

    nodeModuleAssert.deepEqual(
      await fetch(`${option.baseUrl}/test-json`).then((response) => response.json()),
      { testKey: 'testValue' }
    )

    stop()
  })
})
