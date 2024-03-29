import { resolve, dirname } from 'node:path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'node:fs'

import { rethrowError } from 'source/common/error.js'
import { getRandomId } from 'source/common/math/random.js'
import { createCacheMap } from 'source/common/data/CacheMap.js'
import { fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { createAsyncFuncQueue } from 'source/common/module/AsyncFuncQueue.js'
import { parseArrayBufferChunk, uploadArrayBufferByChunk } from 'source/common/module/ChunkUpload.js'

import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { writeBuffer } from 'source/node/fs/File.js'
import { createPathPrefixLock } from 'source/node/fs/Path.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete, modifyDeleteForce } from 'source/node/fs/Modify.js'

// TODO: add `fileWebSocketUpload`

// Upload file by first divide the file up into ~1MiB chunks,
//   then upload each (allow retry & out of order).
// Once all chunk is in the server, the file is merged.

const CACHE_SIZE_SUM_MAX = 64 // chunk folder count
const CACHE_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min

const createOnFileChunkUpload = async ({
  rootPath,
  mergePath, // TODO: unfinished file chunk may be left here
  onError = rethrowError,
  allowSkipHashVerify = true, // TODO: now optional, wait for non-isSecureContext browser crypto
  expireTime = CACHE_EXPIRE_TIME,
  chunkCacheMap = createCacheMap({ valueSizeSumMax: CACHE_SIZE_SUM_MAX, expireAfter: expireTime }) // TODO: default chunk cache will reset on server restart, but the file will be left
}) => {
  await createDirectory(rootPath)
  await createDirectory(mergePath)
  const getPath = createPathPrefixLock(rootPath)
  const { push } = createAsyncFuncQueue(onError) // TODO: queue path delete, should also queue upload?

  chunkCacheMap.subscribe(({ type, key, payload }) => { // delete the merge folder when chunkCache is removed
    if (type !== 'delete') return
    const { tempPath } = payload
    push(() => modifyDeleteForce(tempPath))
  })

  return async ({
    bufferPacket,
    cacheKeyPrefix = '', // should stay the same for the chunk upload process
    onUploadStart, // ({ tempPath, filePath, key, chunkTotal, chunkList }) => {} // before start to receive the initial chunk, good place to do extra check/auth
    onUploadChunk, // (chunkData, chunkIndex) => {} // after chunk saved
    onUploadEnd // (chunkData) => {} // after merged file created
  }) => {
    const { chunkArrayBuffer, key, chunkIndex, chunkTotal } = await parseArrayBufferChunk(fromNodejsBuffer(bufferPacket), allowSkipHashVerify)

    const cacheKey = `${cacheKeyPrefix}-${key}-${chunkTotal}`
    let chunkData = chunkCacheMap.get(cacheKey)
    if (chunkData === undefined) { // before saving the first chunk
      const filePath = getPath(key)
      const tempPath = resolve(mergePath, getRandomId(cacheKey).replace(/[^\w-.]/g, '_'))
      chunkData = { tempPath, filePath, key, chunkTotal, chunkList: [] }
      onUploadStart && await onUploadStart(chunkData)
      await createDirectory(tempPath)
    }

    const chunkPath = resolve(chunkData.tempPath, `chunk-${chunkIndex}-${chunkTotal}`)
    await writeBuffer(chunkPath, Buffer.from(chunkArrayBuffer))
    chunkData.chunkList[ chunkIndex ] = { chunkIndex, chunkPath }
    __DEV__ && console.log('[save chunk]', chunkData.chunkList[ chunkIndex ])
    onUploadChunk && await onUploadChunk(chunkData, chunkIndex)

    const chunkCacheCount = Object.keys(chunkData.chunkList).length
    if (chunkCacheCount === chunkTotal) { // all chunk ready
      __DEV__ && console.log('[merge chunk to file]', chunkData.filePath)
      await createDirectory(dirname(chunkData.filePath))
      await writeBuffer(chunkData.filePath, '') // reset old file
      for (const { chunkPath } of chunkData.chunkList) { // merge all chunks to file
        await quickRunletFromStream(
          createReadStream(chunkPath),
          createWriteStream(chunkData.filePath, { flags: 'a' })
        )
      }
      await modifyDelete(chunkData.tempPath)
      chunkCacheMap.delete(cacheKey)
      __DEV__ && console.log('##[done]', chunkCacheMap.size, cacheKey)
      onUploadEnd && await onUploadEnd(chunkData)
    } else if (chunkCacheCount > 1) { // bump the cache on 2nd+ chunks
      chunkCacheMap.touch(cacheKey)
      __DEV__ && console.log('##[touch]', chunkCacheMap.size, cacheKey)
    } else { // save the cache on the first chunk
      chunkCacheMap.set(cacheKey, chunkData)
      __DEV__ && console.log('##[cache]', chunkCacheMap.size, cacheKey)
    }
  }
}

const uploadFileByChunk = async ({
  fileBuffer, filePath, // use path for larger file
  fileSize, // optional
  key, chunkSizeMax,
  uploadChunk, // = async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {}
  onProgress // (uploadedSize, totalSize) => {}
}) => {
  if (fileSize === undefined) fileSize = fileBuffer ? fileBuffer.length : (await fsAsync.stat(filePath)).size
  const fileHandle = fileBuffer ? undefined : await fsAsync.open(filePath)
  const getChunk = fileBuffer
    ? (index, chunkSize) => fromNodejsBuffer(fileBuffer.slice(index, index + chunkSize))
    : async (index, chunkSize) => {
      const buffer = Buffer.allocUnsafe(chunkSize)
      await fileHandle.read(buffer, 0, chunkSize, index) //  buffer, bufferOffset, readLength, readStartPosition
      return fromNodejsBuffer(buffer)
    }
  await uploadArrayBufferByChunk({
    size: fileSize, getChunk,
    key, chunkSizeMax,
    uploadChunk, // = async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {}
    onProgress // optional // = async (uploadedSize, totalSize) => {},
  })
  fileHandle && await fileHandle.close()
}

export {
  createOnFileChunkUpload,
  uploadFileByChunk
}
