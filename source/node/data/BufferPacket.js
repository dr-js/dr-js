import { fromString, toString } from 'source/common/data/ArrayBuffer.js'
import { HEADER_BYTE_SIZE, packArrayBufferHeader } from 'source/common/data/ArrayBufferPacket.js'
import { toArrayBuffer } from './Buffer.js'

const EMPTY_BUFFER = Buffer.allocUnsafe(0)

const packBufferPacket = (headerString, payloadBuffer = EMPTY_BUFFER) => Buffer.concat([
  ...packArrayBufferHeader(fromString(headerString)).map((arrayBuffer) => Buffer.from(arrayBuffer)),
  payloadBuffer
])

const parseBufferPacket = (bufferPacket) => {
  const headerSize = bufferPacket.readUIntBE(0, HEADER_BYTE_SIZE)
  const headerString = toString(toArrayBuffer(bufferPacket.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize)))
  const payloadBuffer = bufferPacket.slice(HEADER_BYTE_SIZE + headerSize)
  return [ headerString, payloadBuffer ]
}

export {
  packBufferPacket,
  parseBufferPacket
}
