import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data/CacheMap'
import { getMIMETypeFromFileName } from 'source/common/module/MIME'
import { statAsync, readFileAsync, createReadStream } from 'source/node/file/__utils__'
import { getWeakEntityTagByStat } from 'source/node/module/EntityTag'
import { responderSendBuffer, responderSendStream } from './Common'

const CACHE_BUFFER_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32mB
const CACHE_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createDefaultCacheMap = () => new CacheMap({
  valueSizeSumMax: CACHE_BUFFER_SIZE_SUM_MAX,
  onCacheAdd: __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
  onCacheDelete: __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
})

const createResponderBufferCache = ({
  getBufferData, // (store, cacheKey) => ({ buffer, length, type, entityTag })
  sizeSingleMax = CACHE_FILE_SIZE_MAX,
  expireTime = CACHE_EXPIRE_TIME,
  serveCacheMap = createDefaultCacheMap()
}) => async (store, cacheKey) => {
  let bufferData = serveCacheMap.get(cacheKey)
  __DEV__ && bufferData && console.log(`[HIT] CACHE: ${cacheKey}`)
  if (!bufferData) {
    bufferData = await getBufferData(store, cacheKey)
    __DEV__ && console.log(`[${bufferData.length <= sizeSingleMax ? 'SET' : 'BAIL'}] CACHE: ${cacheKey}`)
    bufferData.length <= sizeSingleMax && serveCacheMap.set(cacheKey, bufferData, bufferData.length, clock() + expireTime)
  }
  return responderSendBuffer(store, bufferData)
}

const CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512kB
const REGEXP_ENCODING_GZIP = /gzip/i

// TODO: support range for better media serving
const createResponderServeStatic = ({
  sizeSingleMax = CACHE_FILE_SIZE_MAX,
  expireTime = CACHE_EXPIRE_TIME,
  isEnableGzip = false, // will look for `filePath + '.gz'`, if `accept-encoding` has `gzip`
  serveCacheMap = createDefaultCacheMap()
}) => {
  const serveCache = async (store, filePath, encoding) => {
    const bufferData = serveCacheMap.get(filePath)
    if (!bufferData) return false
    __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
    encoding && store.response.setHeader('content-encoding', encoding)
    await responderSendBuffer(store, bufferData)
    return true
  }
  const serve = async (store, filePath, type, encoding) => {
    const stat = await (statAsync(filePath).catch((error) => { __DEV__ && console.log(`[MISS] CACHE: ${filePath}(GZ)`, error) }))
    if (!stat || !stat.isFile()) return false
    const length = stat.size
    const entityTag = getWeakEntityTagByStat(stat)
    encoding && store.response.setHeader('content-encoding', encoding)
    if (length > sizeSingleMax) { // too big, just pipe it
      __DEV__ && console.log(`[BAIL] CACHE: ${filePath}`)
      await responderSendStream(store, { stream: createReadStream(filePath), length, type, entityTag })
    } else {
      const bufferData = { buffer: await readFileAsync(filePath), length, type, entityTag }
      serveCacheMap.set(filePath, bufferData, length, clock() + expireTime)
      __DEV__ && console.log(`[SET] CACHE: ${filePath}`)
      await responderSendBuffer(store, bufferData)
    }
    return true
  }
  return async (store, filePath) => {
    const acceptGzip = isEnableGzip && REGEXP_ENCODING_GZIP.test(store.request.headers[ 'accept-encoding' ]) // try .gz for gzip
    if (acceptGzip && await serveCache(store, filePath + '.gz', 'gzip')) return
    if (await serveCache(store, filePath)) return

    const type = getMIMETypeFromFileName(filePath)
    if (acceptGzip && await serve(store, filePath + '.gz', type, 'gzip')) return
    if (await serve(store, filePath, type)) return

    throw new Error(`[ServeStatic] miss file: ${filePath}`)
  }
}

export {
  createResponderBufferCache,
  createResponderServeStatic
}
