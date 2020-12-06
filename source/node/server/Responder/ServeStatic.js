import { createReadStream, promises as fsAsync } from 'fs'
import { createCacheMap } from 'source/common/data/CacheMap'
import { getMIMETypeFromFileName } from 'source/common/module/MIME'
import { getPathStat } from 'source/node/file/Path'
import { getWeakEntityTagByStat } from 'source/node/module/EntityTag'
import {
  responderSendBuffer, responderSendBufferRange, responderSendBufferCompress,
  responderSendStream, responderSendStreamRange
} from './Send'

const DEFAULT_CACHE_BUFFER_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32MiB
const DEFAULT_CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512KiB
const DEFAULT_CACHE_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createDefaultCacheMap = () => createCacheMap({ valueSizeSumMax: DEFAULT_CACHE_BUFFER_SIZE_SUM_MAX })

// TODO: support HEAD method?

const createResponderBufferCache = ({
  getBufferData, // (store, cacheKey) => ({ buffer, bufferGzip, length, type, entityTag })
  sizeSingleMax = DEFAULT_CACHE_FILE_SIZE_MAX,
  expireTime = DEFAULT_CACHE_EXPIRE_TIME,
  isEnableGzip = false, // will try use `bufferGzip` or compress every time (not good), if `accept-encoding` has `gzip`
  serveCacheMap = createDefaultCacheMap()
}) => {
  const responderSendCacheBuffer = isEnableGzip
    ? responderSendBufferCompress
    : responderSendBuffer
  return async (store, cacheKey) => {
    let bufferData = serveCacheMap.get(cacheKey)
    __DEV__ && bufferData && console.log(`[HIT] CACHE: ${cacheKey}`)
    if (!bufferData) {
      bufferData = await getBufferData(store, cacheKey)
      __DEV__ && console.log(`[${bufferData.length <= sizeSingleMax ? 'SET' : 'BAIL'}] CACHE: ${cacheKey}`)
      bufferData.length <= sizeSingleMax && serveCacheMap.set(cacheKey, bufferData, bufferData.length, Date.now() + expireTime)
    }
    return responderSendCacheBuffer(store, bufferData)
  }
}

const createResponderServeStatic = ({
  sizeSingleMax = DEFAULT_CACHE_FILE_SIZE_MAX,
  expireTime = DEFAULT_CACHE_EXPIRE_TIME,
  isEnableGzip = false, // will try look for `filePath + '.gz'`, if `accept-encoding` has `gzip`
  isEnableRange = true, // only when content is not gzip
  serveCacheMap = createDefaultCacheMap()
}) => {
  const serveCache = async (store, filePath, encoding, range) => {
    const bufferData = serveCacheMap.get(filePath)
    if (!bufferData) return false
    __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
    isEnableRange && !encoding && store.response.setHeader('accept-ranges', 'bytes')
    encoding && store.response.setHeader('content-encoding', encoding)
    if (!range) await responderSendBuffer(store, bufferData)
    else {
      if (range[ 1 ] === Infinity) range[ 1 ] = bufferData.length - 1
      await responderSendBufferRange(store, bufferData, range)
    }
    return true
  }

  const serve = async (store, filePath, type, encoding, range) => {
    const stat = await getPathStat(filePath) // resolve symlink
    if (!stat.isFile() || !stat.size) return false
    const length = stat.size
    const entityTag = getWeakEntityTagByStat(stat)
    isEnableRange && !encoding && store.response.setHeader('accept-ranges', 'bytes')
    encoding && store.response.setHeader('content-encoding', encoding)
    if (range) { // has range, pipe it
      if (range[ 1 ] === Infinity) range[ 1 ] = length - 1
      await responderSendStreamRange(store, { streamRange: createReadStream(filePath, { start: range[ 0 ], end: range[ 1 ] }), length, type, entityTag }, range)
    } else if (length > sizeSingleMax) { // too big, just pipe it
      __DEV__ && console.log(`[BAIL] CACHE: ${filePath}`)
      await responderSendStream(store, { stream: createReadStream(filePath), length, type, entityTag })
    } else { // right size, try cache
      const bufferData = { buffer: await fsAsync.readFile(filePath), length, type, entityTag }
      serveCacheMap.set(filePath, bufferData, length, Date.now() + expireTime)
      __DEV__ && console.log(`[SET] CACHE: ${filePath}`)
      await responderSendBuffer(store, bufferData)
    }
    return true
  }

  return async (store, filePath) => {
    const acceptGzip = isEnableGzip && REGEXP_ENCODING_GZIP.test(store.request.headers[ 'accept-encoding' ]) // try .gz for gzip
    const range = isEnableRange && parseRangeHeader(store.request.headers[ 'range' ])
    if (acceptGzip && await serveCache(store, filePath + '.gz', 'gzip')) return // try .gz
    if (await serveCache(store, filePath, undefined, range)) return
    const type = getMIMETypeFromFileName(filePath)
    if (acceptGzip && await serve(store, filePath + '.gz', type, 'gzip')) return // try .gz
    if (await serve(store, filePath, type, undefined, range)) return
    throw new Error(`miss file: ${filePath}`)
  }
}
const REGEXP_ENCODING_GZIP = /gzip/i

const parseRangeHeader = (rangeString) => {
  const result = REGEXP_HEADER_RANGE.exec(rangeString)
  if (!result) return
  const [ , startString, endString ] = result
  const start = parseInt(startString)
  const end = endString ? parseInt(endString) : Infinity
  if (start < end) return [ start, end ]
}
const REGEXP_HEADER_RANGE = /bytes=(\d+)-(\d+)?$/i

export {
  createDefaultCacheMap,
  createResponderBufferCache,
  createResponderServeStatic
}
