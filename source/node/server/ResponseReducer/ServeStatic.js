import nodeModuleFs from 'fs'
import nodeModulePath from 'path'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'

import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from './__utils__'

const CACHE_FILE_SIZE_MAX = 512 * 1024 // in byte, 512kB
const CACHE_FILE_SIZE_SUM_MAX = 32 * 1024 * 1024 // in byte, 32mB
const EXPIRE_TIME = 60 * 1000 // in msec, 1min

const getFileMIMEByPath = (filePath) => (BASIC_EXTENSION_MAP[ nodeModulePath.extname(filePath).slice(1) ] || DEFAULT_MIME)

const createResponseReducerServeStatic = (staticRoot) => {
  staticRoot = nodeModulePath.normalize(staticRoot)
  const serveCacheMap = new CacheMap({
    valueSizeSumMax: CACHE_FILE_SIZE_SUM_MAX,
    onCacheAdd: __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
    onCacheDelete: __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
  })
  return (store, filePath) => new Promise((resolve, reject) => {
    filePath = nodeModulePath.normalize(nodeModulePath.join(staticRoot, filePath))
    if (!filePath.includes(staticRoot)) reject(new Error('requesting file outside of staticRoot'))
    const cachedData = serveCacheMap.get(filePath)
    if (cachedData) {
      __DEV__ && console.log(`[HIT] CACHE: ${filePath}`)
      store.response.setHeader('Content-Length', cachedData.fileSize)
      store.response.setHeader('Content-Type', cachedData.fileMIME)
      store.response.write(cachedData.fileBuffer)
      return resolve(store)
    }
    nodeModuleFs.stat(filePath, (error, stats) => {
      if (error) return reject(error)
      if (!stats.isFile()) return reject(new Error(`[StaticFileServer] not file: ${filePath}`))
      const fileSize = stats.size
      const fileMIME = getFileMIMEByPath(filePath)
      store.response.setHeader('Content-Length', fileSize)
      store.response.setHeader('Content-Type', fileMIME)
      if (stats.size <= CACHE_FILE_SIZE_MAX) { // cache & serve content
        nodeModuleFs.readFile(filePath, (error, fileBuffer) => {
          if (error) return reject(error)
          __DEV__ && console.log('CACHE SET', { filePath, fileSize, fileMIME })
          serveCacheMap.set(filePath, { fileSize, fileMIME, fileBuffer }, fileSize, clock() + EXPIRE_TIME)
          store.response.write(fileBuffer)
          resolve(store)
        })
      } else { // stream content
        const fileStream = nodeModuleFs.createReadStream(filePath)
        fileStream.on('error', reject)
        fileStream.on('end', () => resolve(store))
        fileStream.pipe(store.response)
      }
    })
  })
}

// for serve small file such as favicon
const createResponseReducerServeStaticSingleCached = (staticFilePath) => {
  const fileCache = { fileBuffer: null, fileSize: null, expireTime: -1 }
  const fileMIME = getFileMIMEByPath(staticFilePath)
  return (store) => {
    const currentTime = clock()
    if (fileCache.expireTime >= currentTime) {
      __DEV__ && console.log('SINGLE CACHE HIT', staticFilePath)
      store.response.setHeader('Content-Length', fileCache.fileSize)
      store.response.setHeader('Content-Type', fileMIME)
      store.response.write(fileCache.fileBuffer)
      return store
    }
    return new Promise((resolve, reject) => {
      nodeModuleFs.stat(staticFilePath, (error, stats) => {
        if (error) return reject(error)
        const fileSize = stats.size
        nodeModuleFs.readFile(staticFilePath, (error, fileBuffer) => {
          if (error) return reject(error)
          __DEV__ && console.log('SINGLE CACHE SET', staticFilePath)
          fileCache.fileBuffer = fileBuffer
          fileCache.fileSize = fileSize
          fileCache.expireTime = currentTime + EXPIRE_TIME
          store.response.setHeader('Content-Length', fileSize)
          store.response.setHeader('Content-Type', fileMIME)
          store.response.write(fileBuffer)
          resolve(store)
        })
      })
    })
  }
}

export {
  createResponseReducerServeStatic,
  createResponseReducerServeStaticSingleCached
}
