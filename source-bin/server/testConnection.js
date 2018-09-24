import { setTimeoutAsync } from 'dr-js/module/common/time'
import { arraySplitChunk } from 'dr-js/module/common/immutable/Array'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { receiveBufferAsync } from 'dr-js/module/node/data/Buffer'
import { responderEndWithStatusCode } from 'dr-js/module/node/server/Responder/Common'
import { responderSendBuffer, responderSendBufferCompress, responderSendJSON, prepareBufferData } from 'dr-js/module/node/server/Responder/Send'
import { METHOD_MAP, createRouteMap, getRouteParam, createResponderRouteList } from 'dr-js/module/node/server/Responder/Router'
import { getServerInfo, commonCreateServer, getDrBrowserScriptHTML } from './function'

const BASIC_METHOD_LIST = [ 'GET', 'POST', 'PUT', 'DELETE' ]

// TODO: support CORS for testing

const createServerTestConnection = ({ protocol = 'http:', hostname, port, log }) => {
  const bufferData = prepareBufferData(Buffer.from(`TEST CONTENT`))

  const routeConfigList = [
    [ [ '/test-describe', '/test-describe/*' ], Object.keys(METHOD_MAP), async (store) => {
      const { url, method, httpVersion, rawHeaders, socket: { remoteAddress, remotePort } } = store.request
      const describeString = JSON.stringify({
        from: `${remoteAddress}:${remotePort}`,
        request: { url, method, httpVersion, headers: arraySplitChunk(rawHeaders, 2).map((fragList) => fragList.join(': ')) }
      }, null, '  ')
      log(`[test-describe]\n${describeString}`)
      return responderSendBufferCompress(store, { buffer: Buffer.from(describeString), type: BASIC_EXTENSION_MAP.json })
    } ],
    [ [ '/test-echo-post', '/test-echo-post/:mime' ], 'POST', async (store) => {
      const { url: { searchParams } } = store.getState()
      const isCompress = !searchParams.has('no-compress')
      return (isCompress ? responderSendBufferCompress : responderSendBuffer)(store, {
        buffer: await receiveBufferAsync(store.request),
        type: BASIC_EXTENSION_MAP[ getRouteParam(store, 'mime') ]
      })
    } ],
    [ '/test-buffer', BASIC_METHOD_LIST, (store) => responderSendBufferCompress(store, bufferData) ],
    [ '/test-json', BASIC_METHOD_LIST, (store) => responderSendJSON(store, { object: { testKey: 'TEST VALUE' } }) ],
    [ '/test-destroy', BASIC_METHOD_LIST, async (store) => store.response.destroy() ],
    [ [ '/test-timeout', '/test-timeout/:wait' ], BASIC_METHOD_LIST, async (store) => {
      const wait = parseInt(getRouteParam(store, 'wait')) || 200
      await setTimeoutAsync(wait)
      return responderSendJSON(store, { object: {} })
    } ],
    [ [ '/test-status-code', '/test-status-code/:status-code' ], BASIC_METHOD_LIST, async (store) => {
      const statusCode = parseInt(getRouteParam(store, 'status-code')) || 200
      return responderEndWithStatusCode(store, { statusCode })
    } ],
    [ [ '/test-retry', '/test-retry/:count' ], BASIC_METHOD_LIST, (() => {
      const retryMap = {}
      return async (store) => {
        const count = parseInt(getRouteParam(store, 'count')) || 4
        const currentCount = (retryMap[ count ] || 0) + 1
        retryMap[ count ] = currentCount % count
        currentCount === count
          ? responderSendJSON(store, { object: {} })
          : store.response.destroy()
      }
    })() ],
    [ '/', 'GET', createResponderRouteList(() => createRouteMap(routeConfigList), [ getDrBrowserScriptHTML() ]) ]
  ]

  const { start } = commonCreateServer({ protocol, hostname, port, routeConfigList, isAddFavicon: true, log })

  start()

  log(getServerInfo('ServerTestConnection', protocol, hostname, port))
}

export { createServerTestConnection }
