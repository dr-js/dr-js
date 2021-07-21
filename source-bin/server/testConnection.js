import { setTimeoutAsync } from 'source/common/time.js'
import { arraySplitChunk } from 'source/common/immutable/Array.js'
import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'

import { readableStreamToBufferAsync } from 'source/node/data/Stream.js'
import { createRequestListener, describeServerOption } from 'source/node/server/Server.js'
import { responderEnd, responderEndWithStatusCode, createResponderLog, createResponderLogEnd } from 'source/node/server/Responder/Common.js'
import { responderSendBuffer, responderSendBufferCompress, responderSendJSON, prepareBufferData, createResponderFavicon } from 'source/node/server/Responder/Send.js'
import { METHOD_MAP, createResponderRouter, createRouteMap, getRouteParam, createResponderRouteListHTML } from 'source/node/server/Responder/Router.js'
import { addExitListenerLossyOnce } from 'source/node/system/ExitListener.js'

const commonServerUp = async ({
  serverExot: { up, server, option }, log, routePrefix,
  routeConfigList, isAddFavicon,
  title, extraInfo = {}
}) => {
  const responderLogEnd = createResponderLogEnd({ log })
  server.on('request', createRequestListener({
    responderList: [
      createResponderLog({ log }),
      createResponderRouter({
        routeMap: createRouteMap([
          ...routeConfigList,
          !routePrefix && isAddFavicon && [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
        ].filter(Boolean), routePrefix),
        baseUrl: option.baseUrl
      })
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
  await up()
  routePrefix && Object.assign(extraInfo, { routePrefix })
  log(describeServerOption(option, title, extraInfo))
}
const commonServerDown = (serverExot, log) => addExitListenerLossyOnce(({ eventType, error }) => {
  log && log(`[exit|${eventType}] ${error}`)
  return serverExot.down()
})

const BASIC_METHOD_LIST = [ 'GET', 'POST', 'PUT', 'DELETE' ]

// TODO: support CORS for testing

const configure = ({ log, routePrefix }) => {
  const bufferData = prepareBufferData(Buffer.from('TEST CONTENT'))

  const routeConfigList = [
    [ [ '/test-describe', '/test-describe/*' ], Object.keys(METHOD_MAP), async (store) => {
      const { url, method, httpVersion, rawHeaders, socket: { remoteAddress, remotePort } } = store.request
      const describeObject = {
        from: `${remoteAddress}:${remotePort}`,
        request: { url, method, httpVersion, headers: arraySplitChunk(rawHeaders, 2).map((fragList) => fragList.join(': ')) }
      }
      log(`[test-describe]\n${JSON.stringify(describeObject, null, 2)}`)
      return responderSendJSON(store, { object: describeObject })
    } ],
    [ [ '/test-echo-post', '/test-echo-post/:mime' ], 'POST', async (store) => {
      const { url: { searchParams } } = store.getState()
      const isCompress = !searchParams.has('no-compress')
      return (isCompress ? responderSendBufferCompress : responderSendBuffer)(store, {
        buffer: await readableStreamToBufferAsync(store.request),
        type: BASIC_EXTENSION_MAP[ getRouteParam(store, 'mime') ]
      })
    } ],
    [ '/test-buffer', BASIC_METHOD_LIST, (store) => responderSendBufferCompress(store, bufferData) ],
    [ '/test-json', BASIC_METHOD_LIST, (store) => responderSendJSON(store, { object: { testKey: 'TEST VALUE' } }) ],
    [ '/test-destroy', BASIC_METHOD_LIST, async (store) => store.response.destroy() ],
    [ [ '/test-timeout', '/test-timeout/:wait' ], BASIC_METHOD_LIST, async (store) => {
      const wait = parseInt(getRouteParam(store, 'wait')) || 200
      await setTimeoutAsync(wait)
      return responderSendJSON(store, { object: { wait } })
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
          ? await responderSendJSON(store, { object: { count } })
          : store.response.destroy()
      }
    })() ],
    [ [ '/', '' ], 'GET', createResponderRouteListHTML({ getRouteMap: () => createRouteMap(routeConfigList, routePrefix) }) ]
  ]

  return {
    routeConfigList,
    isAddFavicon: true,
    title: 'TestConnection'
  }
}

export {
  commonServerUp, commonServerDown,
  configure
}
