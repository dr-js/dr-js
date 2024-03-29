import { getTimestamp } from 'source/common/time.js'
import { getRandomArrayBuffer } from 'source/common/math/random.js'
import { swapObfuscateString } from 'source/common/data/function.js'
import { packArrayBufferPacket, parseArrayBufferPacket, packArrayBufferPacket2, parseArrayBufferPacket2 } from 'source/common/data/ArrayBufferPacket.js'

const CHECK_CODE_SEP = '-'

const __DEV__ = false

const calcCode = (size, tokenSize, dataView, seed = 0) => {
  seed = Math.floor(seed)
  const seedBinaryCharList = seed.toString(2).padStart(tokenSize, '0').split('') // the seed need to be big enough, or there'll be very few loops and output like `00000***`
  const valueMax = Math.pow(16, tokenSize)
  let dataViewIndex = seed % size
  let value = dataView.getUint8(dataViewIndex) // 0 to 255, 8bit
  __DEV__ && console.log('calcCode', { seed, seedBinaryCharList, dataViewIndex, value })
  for (let seedIndex = seedBinaryCharList.length - 1; seedIndex >= 0; seedIndex--) { // loop in reverse so the last digit change the whole hash
    const stepMode = seedBinaryCharList[ seedIndex ] === '1'
    dataViewIndex = (dataViewIndex + (stepMode ? 1 : dataView.getUint8((dataViewIndex + 1) % size))) % size
    value = ((stepMode ? value : value * 16) + dataView.getUint8(dataViewIndex)) % valueMax
    __DEV__ && console.log('calcCode step', { dataViewData: dataView.getUint8(dataViewIndex), dataViewIndex, seedIndex, value })
  }
  __DEV__ && console.log('calcCode', { value })
  return (value % Math.pow(2, 4 * tokenSize)).toString(16).padStart(tokenSize, '0')
}

const verifyOption = ({
  tag = getTimestamp().toString(36), // /^\w*$/ only, public visible, set a long tag will cause long checkCode
  size = 64 * 1024 + 32, // in byte, 32 based, min 1024byte // NOTE: add small offset so `calcCode` will be more random
  tokenSize = 8, // in byte, min 2byte, max 13byte (limited by calc step `Math.pow(16, tokenSize)`)
  timeGap = 30, // in sec, min 1sec, set amount of client-server time diff is accepted
  info = null // extra data, any JSON value, can be used for marking what this is for
}) => {
  if (!/^\w*$/.test(tag)) throw new Error(`invalid tag: ${tag}`)
  if (!Number.isInteger(size) || size <= 1024 || size % 32) throw new Error(`invalid size: ${size}`)
  if (!Number.isInteger(tokenSize) || tokenSize > 13 || tokenSize < 2) throw new Error(`invalid tokenSize: ${tokenSize}`)
  if (!Number.isInteger(timeGap) || timeGap < 1) throw new Error(`invalid timeGap: ${timeGap}`)
  return { tag, size, tokenSize, timeGap, info }
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
    dataView: new DataView(getRandomArrayBuffer(option.size))
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

const packDataArrayBuffer = ({ tag, size, tokenSize, timeGap, info, dataView }) => packArrayBufferPacket(
  JSON.stringify([ tag, size, tokenSize, timeGap, info ]),
  dataView.buffer
)

const parseDataArrayBuffer = (dataArrayBuffer) => {
  const [ headerString, payloadArrayBuffer ] = parseArrayBufferPacket(dataArrayBuffer)
  const [ tag, size, tokenSize, timeGap, info = null ] = JSON.parse(headerString)
  return { tag, size, tokenSize, timeGap, info, dataView: new DataView(payloadArrayBuffer) }
}

const packDataArrayBuffer2 = ({ tag, size, tokenSize, timeGap, info, dataView }) => packArrayBufferPacket2(
  JSON.stringify([ tag, size, tokenSize, timeGap, info ]),
  dataView.buffer
)

const parseDataArrayBuffer2 = (dataArrayBuffer) => {
  const [ headerString, payloadArrayBuffer ] = parseArrayBufferPacket2(dataArrayBuffer)
  const [ tag, size, tokenSize, timeGap, info = null ] = JSON.parse(headerString)
  return { tag, size, tokenSize, timeGap, info, dataView: new DataView(payloadArrayBuffer) }
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
  parseDataArrayBuffer,
  packDataArrayBuffer2,
  parseDataArrayBuffer2
}
