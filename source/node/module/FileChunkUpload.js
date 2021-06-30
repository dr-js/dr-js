import { resolve, dirname } from 'path'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'

import { rethrowError } from 'source/common/error.js'
import { getRandomId } from 'source/common/math/random.js'
import { createCacheMap } from 'source/common/data/CacheMap.js'
import { fromU16String, toU16String, fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { packChainArrayBufferPacket, parseChainArrayBufferPacket } from 'source/common/data/ArrayBufferPacket.js'
import { createAsyncFuncQueue } from 'source/common/module/AsyncFuncQueue.js'

import { calcHash } from 'source/node/data/Buffer.js'
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
  chunkCacheMap = createCacheMap({ valueSizeSumMax: CACHE_SIZE_SUM_MAX }) // TODO: default chunk cache will reset on server restart, but the file will be left
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
    const [ headerArrayBuffer, chunkHashArrayBuffer, chunkArrayBuffer ] = parseChainArrayBufferPacket(fromNodejsBuffer(bufferPacket))
    const { key, chunkByteLength, chunkIndex, chunkTotal } = JSON.parse(toU16String(headerArrayBuffer))
    const chunkBuffer = Buffer.from(chunkArrayBuffer)

    if (chunkByteLength !== chunkBuffer.length) throw new Error(`chunk length mismatch, get: ${chunkBuffer.length}, expect ${chunkByteLength}`)

    if (chunkHashArrayBuffer.byteLength) {
      const chunkHashBuffer = Buffer.from(chunkHashArrayBuffer)
      const verifyChunkHashBuffer = calcHash(chunkBuffer, 'sha256', 'buffer')
      if ((Buffer.compare(chunkHashBuffer, verifyChunkHashBuffer) !== 0)) {
        throw new Error(`chunk ${chunkIndex} of ${key} hash mismatch, get: ${verifyChunkHashBuffer.toString('base64')}, expect ${chunkHashBuffer.toString('base64')}`)
      }
    } else if (!allowSkipHashVerify) throw new Error(`missing chunk ${chunkIndex} of ${key} hash to verify`)

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
    await writeBuffer(chunkPath, chunkBuffer)
    chunkData.chunkList[ chunkIndex ] = { chunkIndex, chunkByteLength, chunkPath }
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
      chunkCacheMap.touch(cacheKey, Date.now() + expireTime)
      __DEV__ && console.log('##[touch]', chunkCacheMap.size, cacheKey)
    } else { // save the cache on the first chunk
      chunkCacheMap.set(cacheKey, chunkData, 1, Date.now() + expireTime)
      __DEV__ && console.log('##[cache]', chunkCacheMap.size, cacheKey)
    }
  }
}

const CHUNK_SIZE_MAX = 1024 * 1024 // 1MB max

const uploadFileByChunk = async ({
  fileBuffer, filePath, // use path for larger file
  fileSize, // optional
  key,
  chunkSizeMax = CHUNK_SIZE_MAX,
  onProgress, // (uploadedSize, totalSize) => {}
  uploadFileChunk // (chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal }) => {}
}) => {
  if (fileSize === undefined) fileSize = fileBuffer ? fileBuffer.length : (await fsAsync.stat(filePath)).size
  let chunkIndex = 0
  const chunkTotal = Math.ceil(fileSize / chunkSizeMax) || 1
  while (chunkIndex < chunkTotal) {
    onProgress && onProgress(chunkIndex * chunkSizeMax, fileSize)
    const chunkSize = (chunkIndex < chunkTotal - 1)
      ? chunkSizeMax
      : fileSize % chunkSizeMax
    let chunkBuffer
    if (fileBuffer) chunkBuffer = fileBuffer.slice(chunkIndex * chunkSizeMax, chunkIndex * chunkSizeMax + chunkSize)
    else {
      const fileHandle = await fsAsync.open(filePath)
      await fileHandle.read((chunkBuffer = Buffer.allocUnsafe(chunkSize)), 0, chunkSize, chunkIndex * chunkSizeMax) //  buffer, bufferOffset, readLength, readStartPosition
      await fileHandle.close()
    }
    const chunkArrayBuffer = fromNodejsBuffer(chunkBuffer)
    const chunkByteLength = chunkArrayBuffer.byteLength
    const chainArrayBufferPacket = packChainArrayBufferPacket([
      fromU16String(JSON.stringify({ key, chunkByteLength, chunkIndex, chunkTotal })), // headerArrayBuffer
      fromNodejsBuffer(calcHash(chunkBuffer, 'sha256', 'buffer')), // verifyChunkHashBuffer
      chunkArrayBuffer
    ])
    await uploadFileChunk(chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal })
    chunkIndex++
  }
  onProgress && onProgress(fileSize, fileSize)
}

export {
  createOnFileChunkUpload,
  uploadFileByChunk
}
