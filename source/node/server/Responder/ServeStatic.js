import { createReadStream, promises as fsAsync } from 'fs'
import { createCacheMap } from 'source/common/data/CacheMap'
import { getMIMETypeFromFileName } from 'source/common/module/MIME'
import { getPathStat } from 'source/node/file/Path'
import { getWeakEntityTagByStat } from 'source/node/module/EntityTag'
import { responderEndWithStatusCode } from './Common'
import {
  responderSendBuffer, responderSendBufferRange, responderSendBufferCompress,
  responderSendStream, responderSendStreamRange
} from './Send'

const DEFAULT_CACHE_BUFFER_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32MiB
const DEFAULT_CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512KiB
const DEFAULT_CACHE_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createDefaultCacheMap = () => createCacheMap({ valueSizeSumMax: DEFAULT_CACHE_BUFFER_SIZE_SUM_MAX })

const createResponderBufferCache = ({ // TODO: DEPRECATE: this do not support range, and bad at gzip
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
  isEnableGzip = false, // will try look for pre-compressed `filePath + '.gz'`, if `accept-encoding` has `gzip`
  isEnableRange = true, // only when content is not gzip
  serveCacheMap = createDefaultCacheMap()
}) => {
  const serveHEAD = async (store, filePath) => {
    if (store.request.method !== 'HEAD') return false
    let bufferData = serveCacheMap.get(filePath)
    if (!bufferData) {
      const stat = await getPathStat(filePath) // resolve symlink
      if (stat.isFile()) {
        const entityTag = getWeakEntityTagByStat(stat)
        const type = getMIMETypeFromFileName(filePath)
        const length = stat.size
        bufferData = { entityTag, type, length }
      } else throw new Error(`miss file: ${filePath}`)
    }
    const headerMap = {
      'etag': bufferData.entityTag,
      'content-type': bufferData.type,
      'content-length': bufferData.length,
      'accept-ranges': isEnableRange ? 'bytes' : 'none'
    }
    await responderEndWithStatusCode(store, { statusCode: 200, headerMap })
    return true
  }

  const serveCache = async (store, filePath, encoding, rangePair) => {
    const bufferData = serveCacheMap.get(filePath)
    if (!bufferData) return false
    __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
    encoding && store.response.setHeader('content-encoding', encoding)
    isEnableRange && !encoding && store.response.setHeader('accept-ranges', 'bytes') // no "gzip+range" combo, check: https://stackoverflow.com/questions/33947562/is-it-possible-to-send-http-response-using-gzip-and-byte-ranges-at-the-same-time
    if (rangePair) {
      rangePair[ 1 ] = Math.min(rangePair[ 1 ], bufferData.length - 1)
      await responderSendBufferRange(store, bufferData, rangePair)
    } else await responderSendBuffer(store, bufferData)
    return true
  }

  const serve = async (store, filePath, filePathGz, rangePair) => {
    const filePathServe = filePathGz || filePath
    const stat = await getPathStat(filePathServe) // resolve symlink
    if (!stat.isFile()) return false
    const entityTag = getWeakEntityTagByStat(stat)
    const type = getMIMETypeFromFileName(filePath)
    const length = stat.size
    filePathGz && store.response.setHeader('content-encoding', 'gzip')
    isEnableRange && !filePathGz && store.response.setHeader('accept-ranges', 'bytes') // no "gzip+range" combo, check: https://stackoverflow.com/questions/33947562/is-it-possible-to-send-http-response-using-gzip-and-byte-ranges-at-the-same-time
    if (rangePair) { // has range, pipe it
      rangePair[ 1 ] = Math.min(rangePair[ 1 ], length - 1)
      await responderSendStreamRange(store, { streamRange: createReadStream(filePathServe, { start: rangePair[ 0 ], end: rangePair[ 1 ] }), entityTag, type, length }, rangePair)
    } else if (length > sizeSingleMax) { // too big, just pipe it
      __DEV__ && console.log(`[BAIL] CACHE: ${filePathServe}`)
      await responderSendStream(store, { stream: createReadStream(filePathServe), entityTag, type, length })
    } else { // right size, try cache
      const bufferData = { buffer: await fsAsync.readFile(filePathServe), entityTag, type, length }
      serveCacheMap.set(filePathServe, bufferData, length, Date.now() + expireTime)
      __DEV__ && console.log(`[SET] CACHE: ${filePathServe}`)
      await responderSendBuffer(store, bufferData)
    }
    return true
  }

  return async (store, filePath) => {
    if (await serveHEAD(store, filePath)) return

    const filePathGz = isEnableGzip && REGEXP_ENCODING_GZIP.test(store.request.headers[ 'accept-encoding' ]) && filePath + '.gz'
    const rangePair = isEnableRange && parseRangeHeader(store.request.headers[ 'range' ])

    // try serve from cache (memory) first
    if (filePathGz && await serveCache(store, filePathGz, 'gzip')) return // try .gz, but drop range
    if (await serveCache(store, filePath, undefined, rangePair)) return

    // serve from fs (disk)
    if (filePathGz && await serve(store, filePath, filePathGz)) return // try .gz, but drop range
    if (await serve(store, filePath, undefined, rangePair)) return

    // no file
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
  createResponderServeStatic,

  createResponderBufferCache // TODO: DEPRECATE
}
