import { fromU16String, toU16String, fromNodejsBuffer } from 'source/common/data/ArrayBuffer.js'
import { HEADER_BYTE_SIZE, packArrayBufferHeader } from 'source/common/data/ArrayBufferPacket.js'

const EMPTY_BUFFER = Buffer.allocUnsafe(0)

const packBufferPacket = (headerU16String, payloadBuffer = EMPTY_BUFFER) => Buffer.concat([
  ...packArrayBufferHeader(fromU16String(headerU16String)).map((arrayBuffer) => Buffer.from(arrayBuffer)),
  payloadBuffer
])

const parseBufferPacket = (bufferPacket) => {
  const headerSize = bufferPacket.readUIntBE(0, HEADER_BYTE_SIZE)
  const headerU16String = toU16String(fromNodejsBuffer(bufferPacket.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize)))
  const payloadBuffer = bufferPacket.slice(HEADER_BYTE_SIZE + headerSize)
  return [ headerU16String, payloadBuffer ]
}

export {
  packBufferPacket,
  parseBufferPacket
}
