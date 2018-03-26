import { clock, setTimeoutAsync } from 'dr-js/module/common/time'
import { time as formatTime } from 'dr-js/module/common/format'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { receiveBufferAsync } from 'dr-js/module/node/data/Buffer'
import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, responderSendBuffer, responderSendJSON, createResponderParseURL, responderEndWithStatusCode } from 'dr-js/module/node/server/Responder/Common'
import { createResponderRouter, createRouteMap, getRouteParam } from 'dr-js/module/node/server/Responder/Router'
import { getServerInfo } from './function'

const createServerTestConnection = ({ protocol, hostname, port, log }) => {
  const BUFFER_SCRIPT = Buffer.from(`TEST CONTENT`)

  const { server, start, option } = createServer({ protocol, hostname, port })

  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouteMap([
        [ '/', 'GET', (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT, type: BASIC_EXTENSION_MAP.html }) ],
        [ '/test-buffer', 'GET', (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ],
        [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'TEST VALUE' } }) ],
        [ '/test-destroy', 'GET', async (store) => store.response.destroy() ],
        [ [ '/test-timeout', '/test-timeout/:wait' ], 'GET', async (store) => {
          const wait = parseInt(getRouteParam(store, 'wait')) || 200
          await setTimeoutAsync(wait)
          return responderEndWithStatusCode(store, { statusCode: 200 })
        } ],
        [ [ '/test-status-code', '/test-status-code/:status-code' ], 'GET', async (store) => {
          const statusCode = parseInt(getRouteParam(store, 'status-code')) || 200
          return responderEndWithStatusCode(store, { statusCode })
        } ],
        [ [ '/test-retry', '/test-retry/:count' ], 'GET', (() => {
          const retryMap = {}
          return async (store) => {
            const count = parseInt(getRouteParam(store, 'count')) || 4
            const currentCount = (retryMap[ count ] || 0) + 1
            retryMap[ count ] = currentCount % count
            currentCount === count
              ? responderEndWithStatusCode(store, { statusCode: 200 })
              : store.response.destroy()
          }
        })() ],
        [ [ '/test-echo', '/test-echo/:mime' ], 'POST', async (store) => {
          const buffer = await receiveBufferAsync(store.request)
          const type = BASIC_EXTENSION_MAP[ getRouteParam(store, 'mime') ]
          return responderSendBuffer(store, { buffer, type })
        } ]
      ]))
    ],
    responderEnd: async (store) => {
      await responderEnd(store)
      const { time, method } = store.getState()
      log(`[${new Date().toISOString()}|${method}] ${store.request.url} (${formatTime(clock() - time)})`)
    }
  }))

  start()

  log(getServerInfo('ServerTestConnection', protocol, hostname, port))
}

export { createServerTestConnection }
