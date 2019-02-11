import { getTimestamp } from 'source/common/time'
import { getRandomArrayBuffer } from 'source/common/math/random'
import { swapObfuscateString } from 'source/common/data/function'
import { packArrayBufferPacket, parseArrayBufferPacket } from 'source/common/data/ArrayBufferPacket'

const CHECK_CODE_SEP = '-'
const CHAR_CODE_1 = '1'.charCodeAt(0)

const calcCode = (size, tokenSize, dataView, seed = 0) => {
  seed = Math.floor(seed)
  const seedBinaryString = seed.toString(2)
  const valueMax = Math.pow(16, tokenSize)
  let index = seed % size
  let value = dataView.getUint8(index) // 0 to 255, 8bit
  __DEV__ && console.log('calcCode', { seed, seedBinaryString, index, value })
  for (let seedIndex = 0, seedIndexMax = seedBinaryString.length; seedIndex < seedIndexMax; seedIndex++) {
    if (seedBinaryString.charCodeAt(seedIndex) === CHAR_CODE_1) index = (index + dataView.getUint8((index + 1) % size)) % size
    else value = value * 16 // shift 4bit

    value = (value + dataView.getUint8(index)) % valueMax
    __DEV__ && console.log('calcCode step', { dataViewData: dataView.getUint8(index), index, seedIndex, value })
  }
  __DEV__ && console.log('calcCode', { value })
  return (value % Math.pow(2, 4 * tokenSize)).toString(16).padStart(tokenSize, '0')
}

const verifyOption = ({
  tag = getTimestamp().toString(36), // /^\w*$/ only, public visible, set a long tag will cause long checkCode
  size = 64 * 1024, // in byte, 32 based, min 1024byte
  tokenSize = 8, // in byte, min 2byte, max 13byte (limited by calc step `Math.pow(16, tokenSize)`)
  timeGap = 30 // in sec, min 1sec, set amount of client-server time diff is accepted
}) => {
  if (!/^\w*$/.test(tag)) throw new Error(`invalid tag: ${tag}`)
  if (!Number.isInteger(size) || size <= 1024 || size % 32) throw new Error(`invalid size: ${size}`)
  if (!Number.isInteger(tokenSize) || tokenSize > 13 || tokenSize < 2) throw new Error(`invalid tokenSize: ${tokenSize}`)
  if (!Number.isInteger(timeGap) || timeGap < 1) throw new Error(`invalid timeGap: ${timeGap}`)
  return { tag, size, tokenSize, timeGap }
}

const verifyCheckCode = (
  timedLookupData,
  checkCode,
  timestamp = getTimestamp()
) => {
  __DEV__ && console.log('verifyCheckCode', timedLookupData.tokenSize, timedLookupData.timeGap, checkCode, timestamp)
  if (typeof (checkCode) !== 'string' || checkCode.length < timedLookupData.tokenSize) throw new Error(`invalid checkCode: ${checkCode}`)
  verifyParsedCheckCode(timedLookupData, parseCheckCode(checkCode), timestamp)
}

const verifyParsedCheckCode = (
  { tag, size, tokenSize, timeGap, dataView },
  [ verifyTag, verifyTimestamp, verifyCode ],
  timestamp = getTimestamp()
) => {
  __DEV__ && console.log('verifyParsedCheckCode', tokenSize, timeGap, [ verifyTag, verifyTimestamp, verifyCode ], timestamp)
  if (verifyTag !== tag) throw new Error(`tag mismatch: ${verifyTag}, expect: ${tag}`)
  if (Math.abs(timestamp - verifyTimestamp) > timeGap) throw new Error(`timestamp mismatch: ${verifyTimestamp}, expect: ${timestamp}±${timeGap}`)
  const code = calcCode(size, tokenSize, dataView, verifyTimestamp / timeGap)
  if (code !== verifyCode) throw new Error(`code mismatch: ${verifyCode}, expect: ${code}`)
}

const generateLookupData = (option) => {
  option = verifyOption(option)
  return {
    ...option,
    dataView: new DataView(getRandomArrayBuffer(option.size)) // TODO: add timestamp & checksum of dataView?
  }
}

const generateCheckCode = (
  { tag, size, tokenSize, timeGap, dataView },
  timestamp = getTimestamp()
) => {
  const code = calcCode(size, tokenSize, dataView, timestamp / timeGap)
  __DEV__ && console.log('generateCheckCode', tokenSize, timeGap, timestamp, code)
  return packCheckCode(tag, timestamp, code)
}

const packCheckCode = (tagString, timestamp, codeString) => swapObfuscateString([
  tagString,
  timestamp.toString(36),
  codeString
].join(CHECK_CODE_SEP))

const parseCheckCode = (checkCodeString) => {
  const resultList = swapObfuscateString(checkCodeString).split(CHECK_CODE_SEP)
  resultList[ 1 ] = Number.parseInt(resultList[ 1 ], 36) // string to number
  return resultList // [ tagString, timestamp, codeString ]
}

const packDataArrayBuffer = ({ tag, size, tokenSize, timeGap, dataView }) => packArrayBufferPacket(
  JSON.stringify([ tag, size, tokenSize, timeGap ]),
  dataView.buffer
)

const parseDataArrayBuffer = (dataArrayBuffer) => {
  const [ headerString, payloadArrayBuffer ] = parseArrayBufferPacket(dataArrayBuffer)
  const [ tag, size, tokenSize, timeGap ] = JSON.parse(headerString)
  return { tag, size, tokenSize, timeGap, dataView: new DataView(payloadArrayBuffer) }
}

export {
  verifyOption,
  verifyCheckCode,
  verifyParsedCheckCode,

  generateLookupData,
  generateCheckCode,

  packCheckCode,
  parseCheckCode,

  packDataArrayBuffer,
  parseDataArrayBuffer
}
