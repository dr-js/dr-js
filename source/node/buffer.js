const MAX_BUFFER_PACKET_SIZE = Math.pow(2, 16) - 1

const packBufferPacket = (headerString, payloadBuffer) => {
  const headerBuffer = Buffer.from(headerString)
  if (headerBuffer.length > MAX_BUFFER_PACKET_SIZE) throw new Error(`[packBufferPacket] headerString exceeds max length ${MAX_BUFFER_PACKET_SIZE} with length: ${headerBuffer.length}`)
  const headerLengthBuffer = Buffer.allocUnsafe(2)
  headerLengthBuffer.writeUInt16BE(headerBuffer.length, 0, !__DEV__)
  return Buffer.concat([ headerLengthBuffer, headerBuffer, payloadBuffer ])
}

const parseBufferPacket = (bufferPacket) => {
  const headerLength = bufferPacket.readUInt16BE(0, !__DEV__)
  const headerString = bufferPacket.slice(2, 2 + headerLength).toString()
  const payloadBuffer = bufferPacket.slice(2 + headerLength)
  return [ headerString, payloadBuffer ]
}

export {
  MAX_BUFFER_PACKET_SIZE,
  packBufferPacket,
  parseBufferPacket
}
