import { uploadArrayBufferByChunk } from 'source/common/module/ChunkUpload.js'
import { parseBlobAsArrayBuffer } from 'source/browser/data/Blob.js'

const { isSecureContext } = window

const uploadFileByChunk = async ({
  fileBlob, fileSize = fileBlob.size,
  key, chunkSizeMax,
  uploadFileChunk, // TODO: DEPRECATE
  uploadChunk = uploadFileChunk, // async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {}
  onProgress // (uploadedSize, totalSize) => {}
}) => uploadArrayBufferByChunk({ // shared code for browser/node upload
  size: fileSize,
  getChunk: async (index, chunkSize) => parseBlobAsArrayBuffer(fileBlob.slice(index, index + chunkSize)),
  key, chunkSizeMax, isSkipVerifyHash: !isSecureContext,
  uploadChunk, // = async (arrayBufferPacket, { chunkArrayBuffer, key, chunkIndex, chunkTotal }) => {}
  onProgress // optional // = async (uploadedSize, totalSize) => {},
})

export { uploadFileByChunk }
