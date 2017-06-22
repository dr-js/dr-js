import nodeModuleFs from 'fs'
import nodeModulePath from 'path'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'

import { createResponseReducerSendStream, createResponseReducerSendBuffer } from './Common'

import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from './__utils__'

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
  return (store) => Promise.resolve(getKey(store))
    .then((cacheKey) => {
      const bufferData = serveCacheMap.get(cacheKey)
      __DEV__ && bufferData && console.log(`[HIT] CACHE: ${cacheKey}`)
      if (bufferData) return bufferData
      return getBufferData(store, cacheKey).then((bufferData) => {
        __DEV__ && bufferData.length <= CACHE_FILE_SIZE_MAX && console.log(`[SET] CACHE: ${cacheKey}`)
        bufferData.length <= CACHE_FILE_SIZE_MAX && serveCacheMap.set(cacheKey, bufferData, bufferData.length, clock() + expireTime)
        return bufferData
      })
    })
    .then((bufferData) => {
      store.setState({ bufferData })
      return responseReducerSendBuffer(store)
    })
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
  return (store) => new Promise((resolve, reject) => {
    const filePath = nodeModulePath.normalize(nodeModulePath.join(staticRoot, store.getState().filePath))
    if (!filePath.includes(staticRoot)) reject(new Error('requesting file outside of staticRoot'))
    const bufferData = serveCacheMap.get(filePath)
    if (bufferData) {
      __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
      store.setState({ bufferData })
      return responseReducerSendBuffer(store)
    }
    nodeModuleFs.stat(filePath, (error, stats) => {
      if (error) return reject(error)
      if (!stats.isFile()) return reject(new Error(`[ServeStatic] not file: ${filePath}`))
      const length = stats.size
      const type = getFileMIMEByPath(filePath)
      if (stats.size > sizeSingleMax) { // too big, just pipe it
        store.setState({ streamData: { stream: nodeModuleFs.createReadStream(filePath), length, type } })
        return responseReducerSendStream(store)
      }
      nodeModuleFs.readFile(filePath, (error, buffer) => {
        if (error) return reject(error)
        const bufferData = { buffer, length, type }
        __DEV__ && console.log(`[SET] CACHE: ${filePath}`)
        serveCacheMap.set(filePath, bufferData, length, clock() + expireTime)
        store.setState({ bufferData })
        return responseReducerSendBuffer(store)
      })
    })
  })
}

// for serve small file such as favicon
const createResponseReducerServeStaticSingleCached = ({ staticFilePath, expireTime = CACHE_EXPIRE_TIME }) => {
  const bufferData = { buffer: null, length: 0, type: getFileMIMEByPath(staticFilePath), expireTime: -1 }
  const responseReducerSendBuffer = createResponseReducerSendBuffer(() => bufferData)
  return (store) => {
    const { time } = store.getState()
    __DEV__ && bufferData.expireTime >= time && console.log(`[HIT] SINGLE CACHE: ${staticFilePath}`)
    if (bufferData.expireTime >= time) return responseReducerSendBuffer(store)
    return new Promise((resolve, reject) => nodeModuleFs.stat(staticFilePath, (error, stats) => {
      if (error) return reject(error)
      if (!stats.isFile()) return reject(new Error(`[ServeStaticSingleCached] not file: ${staticFilePath}`))
      nodeModuleFs.readFile(staticFilePath, (error, buffer) => {
        if (error) return reject(error)
        __DEV__ && console.log(`[SET] SINGLE CACHE: ${staticFilePath}`)
        bufferData.buffer = buffer
        bufferData.length = stats.size
        bufferData.expireTime = time + expireTime
        return responseReducerSendBuffer(store)
      })
    }))
  }
}

export {
  createResponseReducerBufferCache,
  createResponseReducerServeStatic,
  createResponseReducerServeStaticSingleCached
}
