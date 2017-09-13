import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { promisify } from 'util'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module'
import { getWeakEntityTagByStat } from 'source/node/module'

import { createResponderSendStream, createResponderSendBuffer } from './Common'

const statAsync = promisify(nodeModuleFs.stat)
const readFileAsync = promisify(nodeModuleFs.readFile)

const CACHE_BUFFER_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32mB
const CACHE_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createDefaultCacheMap = () => new CacheMap({
  valueSizeSumMax: CACHE_BUFFER_SIZE_SUM_MAX,
  onCacheAdd: __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
  onCacheDelete: __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
})

const createResponderBufferCache = ({
  getKey,
  getBufferData, // { buffer, length, type, entityTag }
  expireTime = CACHE_EXPIRE_TIME,
  serveCacheMap = createDefaultCacheMap()
}) => {
  const responderSendBuffer = createResponderSendBuffer((store) => store.getState().bufferData)
  return async (store) => {
    const cacheKey = await getKey(store)
    let bufferData = serveCacheMap.get(cacheKey)
    __DEV__ && bufferData && console.log(`[HIT] CACHE: ${cacheKey}`)
    if (!bufferData) {
      bufferData = await getBufferData(store, cacheKey)
      __DEV__ && bufferData.length <= CACHE_FILE_SIZE_MAX && console.log(`[SET] CACHE: ${cacheKey}`)
      bufferData.length <= CACHE_FILE_SIZE_MAX && serveCacheMap.set(cacheKey, bufferData, bufferData.length, clock() + expireTime)
    }
    store.setState({ bufferData })
    return responderSendBuffer(store)
  }
}

const CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512kB
const getFileMIMEByPath = (filePath) => (BASIC_EXTENSION_MAP[ nodeModulePath.extname(filePath).slice(1) ] || DEFAULT_MIME)
const REGEXP_ENCODING_GZIP = /gzip/i

const createResponderServeStatic = ({
  staticRoot,
  sizeSingleMax = CACHE_FILE_SIZE_MAX,
  expireTime = CACHE_EXPIRE_TIME,
  isEnableGzip = false, // will look for `filePath + '.gz'`, if `accept-encoding` has `gzip`
  serveCacheMap = createDefaultCacheMap()
}) => {
  staticRoot = nodeModulePath.normalize(staticRoot)
  const responderSendStream = createResponderSendStream((store) => store.getState().streamData)
  const responderSendBuffer = createResponderSendBuffer((store) => store.getState().bufferData)
  const serveCache = async (store, filePath, encoding) => {
    const bufferData = serveCacheMap.get(filePath)
    if (!bufferData) return false
    __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
    encoding && store.response.setHeader('content-encoding', encoding)
    store.setState({ bufferData: bufferData })
    await responderSendBuffer(store)
    return true
  }
  const serve = async (store, filePath, encoding) => {
    const stat = await statAsync(filePath)
    if (!stat.isFile()) return false
    const length = stat.size
    const type = getFileMIMEByPath(filePath)
    const entityTag = getWeakEntityTagByStat(stat)
    encoding && store.response.setHeader('content-encoding', encoding)
    if (stat.size > sizeSingleMax) { // too big, just pipe it
      __DEV__ && console.log(`[BAIL] CACHE: ${filePath}`)
      store.setState({ streamData: { stream: nodeModuleFs.createReadStream(filePath), length, type, entityTag } })
      await responderSendStream(store)
    } else {
      __DEV__ && console.log(`[SET] CACHE: ${filePath}`)
      const bufferData = { buffer: await readFileAsync(filePath), length, type, entityTag }
      serveCacheMap.set(filePath, bufferData, length, clock() + expireTime)
      store.setState({ bufferData })
      await responderSendBuffer(store)
    }
    return true
  }
  return async (store) => {
    const filePath = nodeModulePath.normalize(nodeModulePath.join(staticRoot, store.getState().filePath))
    if (!filePath.includes(staticRoot)) throw new Error(`[ServeStatic] file out of staticRoot: ${filePath}`)
    const acceptGzip = isEnableGzip && REGEXP_ENCODING_GZIP.test(store.request.headers[ 'accept-encoding' ]) // try .gz for gzip
    if (acceptGzip && await serveCache(store, filePath + '.gz', 'gzip')) return
    if (await serveCache(store, filePath)) return
    if (acceptGzip) {
      try {
        if (await serve(store, filePath + '.gz', 'gzip')) return
      } catch (error) { __DEV__ && console.log(`[MISS] CACHE: ${filePath}(GZ)`, error) }
    }
    if (await serve(store, filePath)) return
    throw new Error(`[ServeStatic] miss file: ${filePath}`)
  }
}

export {
  createResponderBufferCache,
  createResponderServeStatic
}
