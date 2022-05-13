import { tryRequire } from 'source/env/tryRequire.js'

/** @type { (a: ArrayBuffer, b: ArrayBuffer) => boolean } */
const isEqualArrayBuffer = (a, b) => {
  if (a === b) return true
  if (a.byteLength !== b.byteLength) return false
  const va = new Uint8Array(a)
  const vb = new Uint8Array(b)
  for (let index = 0, indexMax = a.byteLength; index < indexMax; index++) {
    if (va[ index ] !== vb[ index ]) return false
  }
  return true
}

/** @type { (v: ArrayBuffer[]) => ArrayBuffer } */
const concatArrayBuffer = (arrayBufferList = []) => {
  const resultTypedArray = new Uint8Array(arrayBufferList.reduce((o, arrayBuffer) => o + arrayBuffer.byteLength, 0))
  let byteOffset = 0
  arrayBufferList.forEach((arrayBuffer) => {
    const { byteLength } = arrayBuffer
    resultTypedArray.set(new Uint8Array(arrayBuffer), byteOffset)
    byteOffset += byteLength
  })
  return resultTypedArray.buffer
}

/** @type { (v: ArrayBuffer, a: number[], b: number) => ArrayBuffer[] } */
const deconcatArrayBuffer = (concatedArrayBuffer, byteLengthList, byteOffset = 0) => byteLengthList.map((byteLength) => {
  const arrayBuffer = concatedArrayBuffer.slice(byteOffset, byteOffset + byteLength)
  byteOffset += byteLength
  return arrayBuffer
})

// NOTE: not safe for localStorage (OK in Chrome, but Firefox will filter string as UTF-16 on save, and load with different result)
// NOTE: unknown origin U16String should be considered as Uint16ArrayBuffer
// targeted usage: change data form and later read back, like during network transmitting (JSON -> ArrayBuffer -> binary packet)
// string to arrayBuffer will use more space (in string unicode encode use 8bit instead of 16bit for char like [a-z])
// invalid UTF-16 char will be kept in output U16String, unlike the 57236 -> 65533 mapping in `TextEncoder/TextDecoder/Buffer.toString`
/** @typedef { string } U16String */
const PREFIX_ODD = Uint8Array.of(0x00)
const PREFIX_EVEN = Uint8Array.of(0xff, 0xff)
const CHUNK_SIZE = 3 * 4 * 1024 // use chunk to compress array to string early, to save memory
const encodeU16Chunk = (dataView, index, indexMax) => {
  const charCodeList = []
  for (; index < indexMax; index++) charCodeList.push(String.fromCharCode(dataView.getUint16(index * 2, false)))
  return charCodeList.join('')
}
/** @type { (v: ArrayBuffer) => U16String } */
const toU16String = (arrayBuffer) => { // NOTE: if the source string is not UTF-16, caution not send the string though API with UTF-16 filter
  const packArrayBuffer = concatArrayBuffer([
    arrayBuffer.byteLength % 2 ? PREFIX_ODD : PREFIX_EVEN,
    arrayBuffer
  ])
  const dataView = new DataView(packArrayBuffer)
  const stringList = []
  for (let index = 0, indexMax = dataView.byteLength / 2; index < indexMax; index += CHUNK_SIZE) {
    stringList.push(encodeU16Chunk(dataView, index, Math.min(indexMax, index + CHUNK_SIZE)))
  }
  return stringList.join('')
}

/** @type { (v: U16String) => ArrayBuffer } */
const fromU16String = (string = '') => {
  const dataView = new DataView(new ArrayBuffer(string.length * 2))
  for (let index = 0, indexMax = string.length; index < indexMax; index++) {
    dataView.setUint16(index * 2, string.charCodeAt(index), false)
  }
  return dataView.buffer.slice(dataView.getUint8(0) === 0x00
    ? PREFIX_ODD.byteLength
    : PREFIX_EVEN.byteLength
  )
}

// NOTE: why check & slice: in Node.js most small Buffers are views on a bigger shared ArrayBuffer.
// https://nodejs.org/api/buffer.html#buffer_buf_buffer
// https://github.com/nodejs/node/issues/3580
/** @type { (v: Buffer) => ArrayBuffer } */
const fromNodejsBuffer = (nodejsBuffer) => {
  const { buffer: arrayBuffer, byteOffset, byteLength } = nodejsBuffer
  return arrayBuffer.byteLength === byteLength
    ? arrayBuffer
    : arrayBuffer.slice(byteOffset, byteOffset + byteLength)
}

const tryCalcSHA256ArrayBuffer = () => {
  try { // browser // TODO: non-https site can not access window.crypto.subtle
    const { crypto, isSecureContext } = globalThis
    const calcSHA256ArrayBuffer = async (arrayBuffer) => crypto.subtle.digest('SHA-256', arrayBuffer)
    if (isSecureContext && crypto.subtle.digest) return calcSHA256ArrayBuffer
  } catch (error) { __DEV__ && console.log('[tryCalcSHA256ArrayBuffer] browser', error) }

  try { // node
    const { createHash } = tryRequire('node:crypto')
    const calcSHA256ArrayBuffer = async (arrayBuffer) => { // the code is actually sync
      const buffer = createHash('sha256').update(Buffer.from(arrayBuffer)).digest()
      return fromNodejsBuffer(buffer)
    }
    if (createHash && createHash('sha256')) return calcSHA256ArrayBuffer
  } catch (error) { __DEV__ && console.log('[tryCalcSHA256ArrayBuffer] node', error) }

  return async (arrayBuffer) => { // last fallback
    throw new Error('not supported')
  }
}

/** @type { (v: ArrayBuffer) => Promise<ArrayBuffer> } */
const calcSHA256ArrayBuffer = tryCalcSHA256ArrayBuffer()

export {
  isEqualArrayBuffer,
  concatArrayBuffer,
  deconcatArrayBuffer,
  fromU16String, toU16String,
  fromNodejsBuffer,
  calcSHA256ArrayBuffer
}
