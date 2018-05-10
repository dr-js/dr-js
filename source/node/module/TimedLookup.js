import { verifyOption } from 'source/common/module/TimedLookup'
import { getRandomBufferAsync } from 'source/node/data/function'
import { toArrayBuffer } from 'source/node/data/Buffer'
import { packBufferPacket, parseBufferPacket } from 'source/node/data/BufferPacket'
import { readFileAsync, writeFileAsync } from 'source/node/file/function'

const generateLookupData = async (option) => {
  const { tag, size, tokenSize, timeGap } = verifyOption(option)
  const buffer = await getRandomBufferAsync(size)
  return { tag, size, tokenSize, timeGap, dataView: new DataView(buffer.buffer) }
}

const packLookupBuffer = ({ tag, size, tokenSize, timeGap, dataView }) => packBufferPacket(
  JSON.stringify({ tag, size, tokenSize, timeGap }),
  Buffer.from(dataView.buffer)
)

const parseLookupBuffer = async (buffer) => {
  const [ headerString, payloadBuffer ] = await parseBufferPacket(buffer)
  return { ...JSON.parse(headerString), dataView: new DataView(toArrayBuffer(payloadBuffer)) }
}

const saveLookupFile = (fileOutput, { tag, size, tokenSize, timeGap, dataView }) => writeFileAsync(fileOutput, packLookupBuffer({ tag, size, tokenSize, timeGap, dataView }))

const loadLookupFile = async (fileOutput) => parseLookupBuffer(await readFileAsync(fileOutput))

export {
  generateLookupData,
  packLookupBuffer,
  parseLookupBuffer,
  saveLookupFile,
  loadLookupFile
}
