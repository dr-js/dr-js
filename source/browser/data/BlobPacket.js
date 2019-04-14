import { fromString, toString } from 'source/common/data/ArrayBuffer'
import { HEADER_BYTE_SIZE, packArrayBufferHeader } from 'source/common/data/ArrayBufferPacket'
import { Blob, parseBlobAsArrayBuffer } from './Blob'

const EMPTY_BLOB = new Blob()

const packBlobPacket = (headerString, payloadBlob = EMPTY_BLOB) => new Blob([
  ...packArrayBufferHeader(fromString(headerString)),
  payloadBlob
])

const parseBlobPacket = async (blobPacket) => {
  // make sure the number is read in Big Endian
  const headerSizeDataView = new DataView(await parseBlobAsArrayBuffer(blobPacket.slice(0, HEADER_BYTE_SIZE)))
  const headerSize = headerSizeDataView.getUint32(0, false)
  const headerString = toString(await parseBlobAsArrayBuffer(blobPacket.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize)))
  const payloadBlob = blobPacket.slice(HEADER_BYTE_SIZE + headerSize)
  return [ headerString, payloadBlob ]
}

export {
  packBlobPacket,
  parseBlobPacket
}
