import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { promisify } from 'util'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'

import { createResponseReducerSendStream, createResponseReducerSendBuffer } from './Common'

import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from './__utils__'

const statAsync = promisify(nodeModuleFs.stat)
const readFileAsync = promisify(nodeModuleFs.readFile)

const CACHE_BUFFER_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32mB
const CACHE_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createResponseReducerBufferCache = ({
  getKey,
  getBufferData, // { buffer, length, type }
  sizeSumMax = CACHE_BUFFER_SIZE_SUM_MAX,
  expireTime = CACHE_EXPIRE_TIME,
  onCacheAdd = __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
  onCacheDelete = __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
}) => {
  const serveCacheMap = new CacheMap({ valueSizeSumMax: sizeSumMax, onCacheAdd, onCacheDelete })
  const responseReducerSendBuffer = createResponseReducerSendBuffer((store) => store.getState().bufferData)
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
    return responseReducerSendBuffer(store)
  }
}

const CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512kB
const getFileMIMEByPath = (filePath) => (BASIC_EXTENSION_MAP[ nodeModulePath.extname(filePath).slice(1) ] || DEFAULT_MIME)

const createResponseReducerServeStatic = ({
  staticRoot,
  sizeSingleMax = CACHE_FILE_SIZE_MAX,
  sizeSumMax = CACHE_BUFFER_SIZE_SUM_MAX,
  expireTime = CACHE_EXPIRE_TIME,
  onCacheAdd = __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
  onCacheDelete = __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
}) => {
  staticRoot = nodeModulePath.normalize(staticRoot)
  const serveCacheMap = new CacheMap({ valueSizeSumMax: sizeSumMax, onCacheAdd, onCacheDelete })
  const responseReducerSendStream = createResponseReducerSendStream((store) => store.getState().streamData)
  const responseReducerSendBuffer = createResponseReducerSendBuffer((store) => store.getState().bufferData)
  return async (store) => {
    const filePath = nodeModulePath.normalize(nodeModulePath.join(staticRoot, store.getState().filePath))
    if (!filePath.includes(staticRoot)) throw new Error('requesting file outside of staticRoot')
    const bufferData = serveCacheMap.get(filePath)
    if (bufferData) {
      __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
      store.setState({ bufferData })
      return responseReducerSendBuffer(store)
    }
    const stats = await statAsync(filePath)
    if (!stats.isFile()) throw new Error(`[ServeStatic] not file: ${filePath}`)
    const length = stats.size
    const type = getFileMIMEByPath(filePath)
    if (stats.size > sizeSingleMax) { // too big, just pipe it
      store.setState({ streamData: { stream: nodeModuleFs.createReadStream(filePath), length, type } })
      return responseReducerSendStream(store)
    }
    const buffer = await readFileAsync(filePath)
    __DEV__ && console.log(`[SET] CACHE: ${filePath}`)
    serveCacheMap.set(filePath, bufferData, length, clock() + expireTime)
    store.setState({ bufferData: { buffer, length, type } })
    return responseReducerSendBuffer(store)
  }
}

// for serve small file such as favicon
const createResponseReducerServeStaticSingleCached = ({ staticFilePath, expireTime = CACHE_EXPIRE_TIME }) => {
  const bufferData = { buffer: null, length: 0, type: getFileMIMEByPath(staticFilePath), expireTime: -1 }
  const responseReducerSendBuffer = createResponseReducerSendBuffer(() => bufferData)
  return async (store) => {
    const { time } = store.getState()
    __DEV__ && bufferData.expireTime >= time && console.log(`[HIT] SINGLE CACHE: ${staticFilePath}`)
    if (bufferData.expireTime >= time) return responseReducerSendBuffer(store)
    const stats = await statAsync(staticFilePath)
    if (!stats.isFile()) throw new Error(`[ServeStaticSingleCached] not file: ${staticFilePath}`)
    const buffer = await readFileAsync(staticFilePath)
    __DEV__ && console.log(`[SET] SINGLE CACHE: ${staticFilePath}`)
    bufferData.buffer = buffer
    bufferData.length = stats.size
    bufferData.expireTime = time + expireTime
    return responseReducerSendBuffer(store)
  }
}

export {
  createResponseReducerBufferCache,
  createResponseReducerServeStatic,
  createResponseReducerServeStaticSingleCached
}
