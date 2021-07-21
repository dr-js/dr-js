import { isEqualArrayBuffer, fromU16String, toU16String, calcSHA256ArrayBuffer } from 'source/common/data/ArrayBuffer.js'
import { packChainArrayBufferPacket, parseChainArrayBufferPacket } from 'source/common/data/ArrayBufferPacket.js'
import { encode } from 'source/common/data/Base64.js'

const packArrayBufferChunk = async (
  { chunkArrayBuffer, key, chunkIndex, chunkTotal }, // chunkInfo
  isSkipVerifyHash = false // TODO: now optional, wait for non-isSecureContext browser crypto
) => packChainArrayBufferPacket([
  fromU16String(JSON.stringify({ key, chunkIndex, chunkTotal, chunkByteLength: chunkArrayBuffer.byteLength })), // headerArrayBuffer
  isSkipVerifyHash ? new ArrayBuffer(0) : await calcSHA256ArrayBuffer(chunkArrayBuffer), // verifyChunkHashBuffer
  chunkArrayBuffer
])

const parseArrayBufferChunk = async (
  arrayBufferPacket,
  allowSkipHashVerify = true // TODO: now optional, wait for non-isSecureContext browser crypto
) => {
  const [ headerArrayBuffer, chunkHashArrayBuffer, chunkArrayBuffer ] = parseChainArrayBufferPacket(arrayBufferPacket)
  const { key, chunkIndex, chunkTotal, chunkByteLength } = JSON.parse(toU16String(headerArrayBuffer))
  if (chunkByteLength !== chunkArrayBuffer.byteLength) throw new Error(`chunk length mismatch, get: ${chunkArrayBuffer.byteLength}, expect ${chunkByteLength}`)
  if (chunkHashArrayBuffer.byteLength) {
    const verifyChunkHashBuffer = await calcSHA256ArrayBuffer(chunkArrayBuffer)
    if (!isEqualArrayBuffer(chunkHashArrayBuffer, verifyChunkHashBuffer)) throw new Error(`chunk ${chunkIndex} of ${key} hash mismatch, get: ${encode(verifyChunkHashBuffer)}, expect ${encode(chunkHashArrayBuffer)}`)
  } else if (!allowSkipHashVerify) throw new Error(`missing chunk ${chunkIndex} of ${key} hash to verify`)
  return { chunkArrayBuffer, key, chunkIndex, chunkTotal } // chunkInfo
}

const CHUNK_SIZE_MAX = 1024 * 1024 // 1MB max

const uploadArrayBufferByChunk = async ({ // shared code for browser/node upload
  arrayBuffer,
  size = arrayBuffer && arrayBuffer.byteLength,
  getChunk = arrayBuffer && ((index, chunkSize) => arrayBuffer.slice(index, index + chunkSize)), // = async (index, chunkSize) => arrayBuffer,

  key,
  chunkSizeMax = CHUNK_SIZE_MAX,
  isSkipVerifyHash = false,
  uploadChunk, // = async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {}
  onProgress // optional // = async (uploadedSize, totalSize) => {},
}) => {
  let chunkIndex = 0
  const chunkTotal = Math.ceil(size / chunkSizeMax) || 1
  while (chunkIndex < chunkTotal) {
    onProgress && await onProgress(chunkIndex * chunkSizeMax, size)
    const chunkSize = (chunkIndex < chunkTotal - 1)
      ? chunkSizeMax
      : size % chunkSizeMax
    const chunkInfo = { chunkArrayBuffer: await getChunk(chunkIndex * chunkSizeMax, chunkSize), key, chunkIndex, chunkTotal }
    await uploadChunk(await packArrayBufferChunk(chunkInfo, isSkipVerifyHash), chunkInfo)
    chunkIndex++
  }
  onProgress && onProgress(size, size)
}

export {
  packArrayBufferChunk, parseArrayBufferChunk,
  uploadArrayBufferByChunk
}
