import { setTimeoutAsync } from '@dr-js/core/module/common/time'
import { arraySplitChunk } from '@dr-js/core/module/common/immutable/Array'
import { BASIC_EXTENSION_MAP } from '@dr-js/core/module/common/module/MIME'

import { readableStreamToBufferAsync } from '@dr-js/core/module/node/data/Stream'
import { createRequestListener, describeServerOption } from '@dr-js/core/module/node/server/Server'
import { responderEnd, responderEndWithStatusCode, createResponderLog, createResponderLogEnd } from '@dr-js/core/module/node/server/Responder/Common'
import { responderSendBuffer, responderSendBufferCompress, responderSendJSON, prepareBufferData, createResponderFavicon } from '@dr-js/core/module/node/server/Responder/Send'
import { METHOD_MAP, createResponderRouter, createRouteMap, getRouteParam, createResponderRouteListHTML } from '@dr-js/core/module/node/server/Responder/Router'
import { addExitListenerSync, addExitListenerAsync } from '@dr-js/core/module/node/system/ExitListener'

const commonServerUp = async ({
  serverExot: { up, server, option },
  log,
  routeConfigList, isAddFavicon,
  title, extraInfoList
}) => {
  const responderLogEnd = createResponderLogEnd({ log })
  server.on('request', createRequestListener({
    responderList: [
      createResponderLog({ log }),
      createResponderRouter({
        routeMap: createRouteMap([
          ...routeConfigList,
          isAddFavicon && [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
        ].filter(Boolean)),
        baseUrl: option.baseUrl
      })
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
  await up()
  log(describeServerOption(option, title, extraInfoList))
}
const commonServerDown = (serverExot) => {
  addExitListenerAsync(serverExot.down)
  addExitListenerSync(serverExot.down)
}

const BASIC_METHOD_LIST = [ 'GET', 'POST', 'PUT', 'DELETE' ]

// TODO: support CORS for testing

const configure = ({ log }) => {
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
    [ '/', 'GET', createResponderRouteListHTML({ getRouteMap: () => createRouteMap(routeConfigList) }) ]
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
