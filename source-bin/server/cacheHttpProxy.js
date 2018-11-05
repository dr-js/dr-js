import { resolve } from 'path'
import { URL } from 'url'

import { getTimestamp } from 'dr-js/module/common/time'
import { withRetryAsync } from 'dr-js/module/common/function'
import { time as formatTime } from 'dr-js/module/common/format'
import { catchAsync } from 'dr-js/module/common/error'
import { arrayMatchDelete } from 'dr-js/module/common/immutable/Array'

import { requestAsync } from 'dr-js/module/node/net'
import { receiveBufferAsync } from 'dr-js/module/node/data/Buffer'
import { writeFileAsync, readFileAsync, unlinkAsync } from 'dr-js/module/node/file/function'
import { createDirectory } from 'dr-js/module/node/file/File'
import { packBufferPacket, parseBufferPacket } from 'dr-js/module/node/data/BufferPacket'
import { METHOD_MAP } from 'dr-js/module/node/server/Responder/Router'
import { createFactDatabase, tryDeleteExtraCache } from 'dr-js/module/node/module/FactDatabase'
import { addExitListenerSync, addExitListenerAsync } from 'dr-js/module/node/system/ExitListener'

import { commonStartServer } from '../function'

const createServerCacheHttpProxy = async ({ // TODO: improve or delete
  protocol = 'http:',
  hostname,
  port,
  log,
  remoteUrlPrefix, // full URL like 'https://aaa:123/path/'
  cachePath, // 'cache-proxy'
  expireTimeSec // time in seconds
}) => {
  const pathCacheState = resolve(cachePath, 'cache-state')
  const pathCachePacket = resolve(cachePath, 'cache-packet')

  await createDirectory(pathCacheState)
  await createDirectory(pathCachePacket)

  const urlObject = new URL(remoteUrlPrefix)
  const factDB = await createFactDatabase({ pathFactDirectory: pathCacheState, onError: console.error })
  await tryDeleteExtraCache({ pathFactDirectory: pathCacheState })
  addExitListenerSync(factDB.end)
  addExitListenerAsync(async () => {
    factDB.end()
    factDB.getSaveFactCachePromise() && await factDB.getSaveFactCachePromise()
  })

  const saveCache = async (requestData, responseData) => {
    const timestamp = getTimestamp()
    const cacheKey = `[${requestData.method}]${requestData.path}`
    const cacheName = `${cacheKey}-${timestamp.toString(36)}.cache`.replace(/[^\w[\].]/g, '_')
    log(` - [cache-proxy] save: ${cacheKey}`)
    const { body, ...cacheResponseInfo } = responseData
    cacheResponseInfo.headers = { ...cacheResponseInfo.headers }
    delete cacheResponseInfo.headers[ 'expires' ] // drop Expires
    const cacheBufferPacket = packBufferPacket(JSON.stringify({ cacheKey, timestamp, cacheResponseInfo }), body)
    await writeFileAsync(resolve(pathCachePacket, cacheName), cacheBufferPacket)
    factDB.add({ [ cacheKey ]: { cacheName, timestamp } })
  }

  const loadCache = async (requestData) => {
    const cacheKey = `[${requestData.method}]${requestData.path}`
    const { cacheName, timestamp } = factDB.getState()[ cacheKey ]
    if (timestamp + expireTimeSec < getTimestamp()) {
      log(` - [cache-proxy] expire: ${cacheKey}`)
      await unlinkAsync(resolve(pathCachePacket, cacheName))
      factDB.add({ [ cacheKey ]: undefined })
      return
    }
    log(` - [cache-proxy] load: ${cacheKey}`)
    const [ headerString, body ] = parseBufferPacket(await readFileAsync(resolve(pathCachePacket, cacheName)))
    const { cacheResponseInfo } = JSON.parse(headerString)
    cacheResponseInfo.body = body
    return cacheResponseInfo
  }

  const filterHeaders = (headers) => {
    headers = { ...headers }
    delete headers[ 'host' ]
    delete headers[ 'connection' ]
    delete headers[ 'cache-control' ]
    delete headers[ 'upgrade-insecure-requests' ]
    return headers
  }

  const responderProxyWithCache = async (store) => {
    log(` - [cache-proxy] ${store.request.url}`)

    const requestBuffer = await receiveBufferAsync(store.request)

    const requestData = {
      path: store.request.url,
      method: store.request.method,
      headers: store.request.headers, // not important
      body: requestBuffer // not important
    }

    let responseData = (await catchAsync(loadCache, requestData)).result
    if (!responseData) {
      await withRetryAsync(async () => {
        const proxyResponse = await requestAsync({
          protocol: urlObject.protocol,
          hostname: urlObject.hostname,
          port: urlObject.port,
          path: store.request.url,
          method: store.request.method,
          headers: filterHeaders(store.request.headers)
        }, requestBuffer)
        responseData = {
          headers: proxyResponse.headers,
          statusCode: proxyResponse.statusCode,
          statusMessage: proxyResponse.statusMessage,
          body: await receiveBufferAsync(proxyResponse)
        }
      }, 3)
      responseData.statusCode >= 200 && responseData.statusCode < 300 && await catchAsync(saveCache, requestData, responseData)
    }

    Object.entries(responseData.headers).forEach(([ name, value ]) => store.response.setHeader(name, value))
    store.response.statusCode = responseData.statusCode
    store.response.statusMessage = responseData.statusMessage
    store.response.end(responseData.body)
  }
  const responderProxyPassThough = async (store) => {
    log(` - [through-proxy] proxy: ${store.request.url}`)
    const requestBuffer = await receiveBufferAsync(store.request)
    const proxyResponse = await requestAsync({
      protocol: urlObject.protocol,
      hostname: urlObject.hostname,
      port: urlObject.port,
      path: store.request.url,
      method: store.request.method,
      headers: filterHeaders(store.request.headers)
    }, requestBuffer)
    const responseBuffer = await receiveBufferAsync(proxyResponse)
    Object.entries(proxyResponse.headers).forEach(([ name, value ]) => store.response.setHeader(name, value))
    store.response.statusCode = proxyResponse.statusCode
    store.response.statusMessage = proxyResponse.statusMessage
    store.response.end(responseBuffer)
  }

  const routeConfigList = [
    [ [ '/', '/*' ], 'GET', responderProxyWithCache ],
    [ [ '/', '/*' ], arrayMatchDelete(Object.keys(METHOD_MAP), 'GET'), responderProxyPassThough ]
  ]

  await commonStartServer({
    protocol,
    hostname,
    port,
    routeConfigList,
    title: 'CacheHttpProxy',
    extraInfoList: [
      `remoteUrlPrefix: ${remoteUrlPrefix}`,
      `cachePath: ${cachePath}`,
      `expireTimeSec: ${formatTime(expireTimeSec * 1000)}`
    ],
    log
  })
}

export { createServerCacheHttpProxy }
