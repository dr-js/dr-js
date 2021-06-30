import { fromU16String } from 'source/common/data/ArrayBuffer.js'
import { packChainArrayBufferPacket } from 'source/common/data/ArrayBufferPacket.js'
import { parseBlobAsArrayBuffer } from 'source/browser/data/Blob.js'

const { crypto, isSecureContext } = window

const CHUNK_SIZE_MAX = 1024 * 1024 // 1MB max

const uploadFileByChunk = async ({
  fileBlob,
  fileSize = fileBlob.size,
  key,
  chunkSizeMax = CHUNK_SIZE_MAX,
  onProgress, // (uploadedSize, totalSize) => {}
  uploadFileChunk // (chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal }) => {}
}) => {
  let chunkIndex = 0
  const chunkTotal = Math.ceil(fileSize / chunkSizeMax) || 1
  while (chunkIndex < chunkTotal) {
    onProgress && onProgress(chunkIndex * chunkSizeMax, fileSize)
    const chunkSize = (chunkIndex < chunkTotal - 1)
      ? chunkSizeMax
      : fileSize % chunkSizeMax
    const chunkArrayBuffer = await parseBlobAsArrayBuffer(fileBlob.slice(chunkIndex * chunkSizeMax, chunkIndex * chunkSizeMax + chunkSize))
    const chunkByteLength = chunkArrayBuffer.byteLength
    const chainArrayBufferPacket = packChainArrayBufferPacket([
      fromU16String(JSON.stringify({ key, chunkByteLength, chunkIndex, chunkTotal })), // headerArrayBuffer
      isSecureContext ? await crypto.subtle.digest('SHA-256', chunkArrayBuffer) : new ArrayBuffer(0), // verifyChunkHashBuffer // TODO: non-https site can not access window.crypto.subtle
      chunkArrayBuffer
    ])
    await uploadFileChunk(chainArrayBufferPacket, { key, chunkByteLength, chunkIndex, chunkTotal })
    chunkIndex++
  }
  onProgress && onProgress(fileSize, fileSize)
}

export { uploadFileByChunk }
