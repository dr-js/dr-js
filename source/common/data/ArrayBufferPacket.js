import { concatArrayBuffer, deconcatArrayBuffer, fromU16String, toU16String } from './ArrayBuffer.js'
/** @typedef { import("./ArrayBuffer.js").U16String } U16String */

const MAX_PACKET_HEADER_SIZE = 0xffffffff // 4GiB
const HEADER_BYTE_SIZE = 4 // Math.ceil(Math.log2(MAX_PACKET_HEADER_SIZE) / 8)
const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0)

/** @type { (v: ArrayBuffer) => [ headerSize: ArrayBuffer, header: ArrayBuffer ] } */
const packArrayBufferHeader = (headerArrayBuffer) => {
  const headerSize = headerArrayBuffer.byteLength
  if (headerSize > MAX_PACKET_HEADER_SIZE) throw new Error(`headerArrayBuffer exceeds max size ${MAX_PACKET_HEADER_SIZE}, get: ${headerSize}`)
  const headerSizeDataView = new DataView(new ArrayBuffer(HEADER_BYTE_SIZE))
  headerSizeDataView.setUint32(0, headerSize, false)
  return [ headerSizeDataView.buffer, headerArrayBuffer ]
}

/** @type { (v: ArrayBuffer) => [ header: ArrayBuffer, payloadOffset: number ] } */
const parseArrayBufferHeader = (arrayBufferPair) => {
  const headerSizeDataView = new DataView(arrayBufferPair.slice(0, HEADER_BYTE_SIZE))
  const headerSize = headerSizeDataView.getUint32(0, false)
  return [
    arrayBufferPair.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize),
    HEADER_BYTE_SIZE + headerSize
  ]
}

/** @type { (header: U16String, payload?: ArrayBuffer) => ArrayBuffer } */
const packArrayBufferPacket = (headerU16String, payloadArrayBuffer = EMPTY_ARRAY_BUFFER) => concatArrayBuffer([
  ...packArrayBufferHeader(fromU16String(headerU16String)),
  payloadArrayBuffer
])

/** @type { (v: ArrayBuffer) => [ header: U16String, payload: ArrayBuffer ] } */
const parseArrayBufferPacket = (arrayBufferPacket) => {
  const [ headerArrayBuffer, payloadOffset ] = parseArrayBufferHeader(arrayBufferPacket)
  const headerU16String = toU16String(headerArrayBuffer)
  const payloadArrayBuffer = arrayBufferPacket.slice(payloadOffset)
  return [ headerU16String, payloadArrayBuffer ]
}

/** @type { (v: ArrayBuffer[]) => ArrayBuffer } */
const packChainArrayBufferPacket = (arrayBufferList = []) => {
  const headerDataView = new DataView(new ArrayBuffer(arrayBufferList.length * 4))
  arrayBufferList.forEach(({ byteLength }, index) => headerDataView.setUint32(index * 4, byteLength, false))
  return concatArrayBuffer([
    ...packArrayBufferHeader(headerDataView.buffer),
    ...arrayBufferList
  ])
}

/** @type { (v: ArrayBuffer) => ArrayBuffer[] } */
const parseChainArrayBufferPacket = (chainArrayBufferPacket) => {
  const [ headerArrayBuffer, payloadOffset ] = parseArrayBufferHeader(chainArrayBufferPacket)
  const headerDataView = new DataView(headerArrayBuffer)
  const byteLengthList = []
  for (let index = 0, indexMax = headerDataView.byteLength / 4; index < indexMax; index++) {
    byteLengthList.push(headerDataView.getUint32(index * 4, false))
  }
  return deconcatArrayBuffer(chainArrayBufferPacket, byteLengthList, payloadOffset)
}

export {
  MAX_PACKET_HEADER_SIZE,
  HEADER_BYTE_SIZE,
  packArrayBufferHeader,
  parseArrayBufferHeader,
  packArrayBufferPacket,
  parseArrayBufferPacket,
  packChainArrayBufferPacket,
  parseChainArrayBufferPacket
}
