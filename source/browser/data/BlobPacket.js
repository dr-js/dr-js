import { fromU16String, toU16String } from 'source/common/data/ArrayBuffer.js'
import { HEADER_BYTE_SIZE, packArrayBufferHeader } from 'source/common/data/ArrayBufferPacket.js'
import { Blob, parseBlobAsArrayBuffer } from './Blob.js'

const EMPTY_BLOB = new Blob()

const packBlobPacket = (headerU16String, payloadBlob = EMPTY_BLOB) => new Blob([
  ...packArrayBufferHeader(fromU16String(headerU16String)),
  payloadBlob
])

const parseBlobPacket = async (blobPacket) => {
  // make sure the number is read in Big Endian
  const headerSizeDataView = new DataView(await parseBlobAsArrayBuffer(blobPacket.slice(0, HEADER_BYTE_SIZE)))
  const headerSize = headerSizeDataView.getUint32(0, false)
  const headerU16String = toU16String(await parseBlobAsArrayBuffer(blobPacket.slice(HEADER_BYTE_SIZE, HEADER_BYTE_SIZE + headerSize)))
  const payloadBlob = blobPacket.slice(HEADER_BYTE_SIZE + headerSize)
  return [ headerU16String, payloadBlob ]
}

export {
  packBlobPacket,
  parseBlobPacket
}
