import { verifyOption } from 'source/common/module/TimedLookup'
import { parseBlobAsArrayBuffer } from 'source/browser/data/Blob'
import { packBlobPacket, parseBlobPacket } from 'source/browser/data/BlobPacket'

const generateLookupData = (option) => {
  const { tag, size, tokenSize, timeGap } = verifyOption(option)
  const arrayBuffer = new ArrayBuffer(size)
  for (let index = 0; index < size; index += 65536) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    // requested length max at 65536 bytes
    window.crypto.getRandomValues(new Uint32Array(arrayBuffer, index, Math.min(65536, size - index) / Uint32Array.BYTES_PER_ELEMENT))
  }
  return { tag, size, tokenSize, timeGap, dataView: new DataView(arrayBuffer) }
}

const packLookupBlob = ({ tag, size, tokenSize, timeGap, dataView }) => packBlobPacket(
  JSON.stringify({ tag, size, tokenSize, timeGap }),
  dataView.buffer
)

const parseLookupBlob = async (blob) => {
  const [ headerString, payloadBlob ] = await parseBlobPacket(blob)
  return { ...JSON.parse(headerString), dataView: new DataView(await parseBlobAsArrayBuffer(payloadBlob)) }
}

export {
  generateLookupData,
  packLookupBlob,
  parseLookupBlob
}
