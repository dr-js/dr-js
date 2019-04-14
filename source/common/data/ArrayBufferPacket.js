import { concatArrayBuffer, deconcatArrayBuffer, fromString, toString } from './ArrayBuffer'

const MAX_PACKET_HEADER_SIZE = 0xffffffff // 4GiB
const HEADER_BYTE_SIZE = 4 // Math.ceil(Math.log2(MAX_PACKET_HEADER_SIZE) / 8)
const EMPTY_ARRAY_BUFFER = new ArrayBuffer(0)

const packArrayBufferHeader = (headerArrayBuffer) => {
  const headerSize = headerArrayBuffer.byteLength
  if (headerSize > MAX_PACKET_HEADER_SIZE) throw new Error(`[packArrayBufferPair] headerArrayBuffer exceeds max size ${MAX_PACKET_HEADER_SIZE} with size: ${headerSize}`)
  const headerSizeDataView = new DataView(new ArrayBuffer(HEADER_BYTE_SIZE))
  headerSizeDataView.setUint32(0, headerSize, false)
  return [ headerSizeDataView.buffer, headerArrayBuffer ]
}

const parseArrayBufferHeader = (arrayBufferPair) => {
  const headerSizeDataView = new DataView(arrayBufferPair.slice(0, HEADER_BYTE_SIZE))
  const headerSize = headerSizeDataView.getUint32(0, false)
  return [
    arrayBufferPair.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize),
    HEADER_BYTE_SIZE + headerSize
  ]
}

const packArrayBufferPacket = (headerString, payloadArrayBuffer = EMPTY_ARRAY_BUFFER) => concatArrayBuffer([
  ...packArrayBufferHeader(fromString(headerString)),
  payloadArrayBuffer
])

const parseArrayBufferPacket = (arrayBufferPacket) => {
  const [ headerArrayBuffer, payloadOffset ] = parseArrayBufferHeader(arrayBufferPacket)
  return [ toString(headerArrayBuffer), arrayBufferPacket.slice(payloadOffset) ]
}

const packChainArrayBufferPacket = (arrayBufferList = []) => {
  const headerDataView = new DataView(new ArrayBuffer(arrayBufferList.length * 4))
  arrayBufferList.forEach(({ byteLength }, index) => headerDataView.setUint32(index * 4, byteLength, false))
  return concatArrayBuffer([
    ...packArrayBufferHeader(headerDataView.buffer),
    ...arrayBufferList
  ])
}

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
