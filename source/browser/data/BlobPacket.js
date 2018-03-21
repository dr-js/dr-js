import { Blob, parseBlobAsText, parseBlobAsArrayBuffer } from './Blob'

const EMPTY_BLOB = new Blob()
const MAX_BLOB_PACKET_SIZE = (1 << 16) - 1
const BLOB_PACKET_SIZE_MASK = (1 << 8) - 1
const packBlobPacket = (headerString, payloadBlob = EMPTY_BLOB) => {
  const headerBlob = new Blob([ headerString ])
  if (headerBlob.size > MAX_BLOB_PACKET_SIZE) throw new Error(`[packBlobPacket] headerString exceeds max length ${MAX_BLOB_PACKET_SIZE} with length: ${headerBlob.size}`)
  // make sure the number is written in Big Endian
  return new Blob([ new Blob([ Uint8Array.of(headerBlob.size >> 8, headerBlob.size & BLOB_PACKET_SIZE_MASK), headerBlob, payloadBlob ]) ])
}
const parseBlobPacket = async (blobPacket) => {
  // make sure the number is read in Big Endian
  const [ headerBlobSizeHigh, headerBlobSizeLow ] = new Uint8Array(await parseBlobAsArrayBuffer(blobPacket.slice(0, 2)))
  const headerLength = (headerBlobSizeHigh << 8) + headerBlobSizeLow
  const headerString = await parseBlobAsText(blobPacket.slice(2, 2 + headerLength))
  const payloadBlob = blobPacket.slice(2 + headerLength)
  return [ headerString, payloadBlob ]
}

export {
  MAX_BLOB_PACKET_SIZE,
  packBlobPacket,
  parseBlobPacket
}
