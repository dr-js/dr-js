import { setTimeoutAsync } from 'dr-js/module/common/time'
import { arraySplitChunk } from 'dr-js/module/common/immutable/Array'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { receiveBufferAsync } from 'dr-js/module/node/data/Buffer'
import { responderEndWithStatusCode } from 'dr-js/module/node/server/Responder/Common'
import { responderSendBuffer, responderSendJSON } from 'dr-js/module/node/server/Responder/Send'
import { METHOD_MAP, createRouteMap, getRouteParam, describeRouteMap } from 'dr-js/module/node/server/Responder/Router'
import { getServerInfo, commonCreateServer } from './function'

const createServerTestConnection = ({ protocol = 'http:', hostname, port, log }) => {
  const BUFFER_SCRIPT = Buffer.from(`TEST CONTENT`)

  let routeMapInfoBuffer
  const getRouteMapInfo = () => {
    if (!routeMapInfoBuffer) {
      const routeMap = createRouteMap(routeConfigList)
      routeMapInfoBuffer = Buffer.from([
        '<pre>',
        '<h2>Route List</h2>',
        '<table>',
        ...describeRouteMap(routeMap).map(({ method, route }) => `<tr><td><b>${method}</b></td><td>${method === '/GET' ? `<a href="${route}">${route}</a>` : route}</td></tr>`),
        '</table>',
        '</pre>'
      ].join('\n'))
    }
    return routeMapInfoBuffer
  }

  const routeConfigList = [
    [ [ '/test-describe', '/test-describe/*' ], Object.keys(METHOD_MAP), async (store) => {
      const { url, method, httpVersion, rawHeaders, socket: { remoteAddress, remotePort } } = store.request
      const describeString = JSON.stringify({
        from: `${remoteAddress}:${remotePort}`,
        request: { url, method, httpVersion, headers: arraySplitChunk(rawHeaders, 2).map((fragList) => fragList.join(': ')) }
      }, null, '  ')
      log(`[test-describe]\n${describeString}`)
      return responderSendBuffer(store, { buffer: Buffer.from(describeString), type: BASIC_EXTENSION_MAP.json })
    } ],
    [ [ '/test-echo-post', '/test-echo-post/:mime' ], 'POST', async (store) => responderSendBuffer(store, {
      buffer: await receiveBufferAsync(store.request),
      type: BASIC_EXTENSION_MAP[ getRouteParam(store, 'mime') ]
    }) ],
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
    [ '/', 'GET', (store) => responderSendBuffer(store, { buffer: getRouteMapInfo(), type: BASIC_EXTENSION_MAP.html }) ]
  ]

  const { start } = commonCreateServer({ protocol, hostname, port, routeConfigList, isAddFavicon: true, log })

  start()

  log(getServerInfo('ServerTestConnection', protocol, hostname, port))
}

export { createServerTestConnection }
