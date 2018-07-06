import { getTimestamp } from 'source/common/time'
import { getRandomArrayBuffer } from 'source/common/math/random'
import { swapObfuscateString } from 'source/common/data/function'
import { packArrayBufferPacket, parseArrayBufferPacket } from 'source/common/data/ArrayBufferPacket'

const CHECK_CODE_SEP = '-'
const CHAR_CODE_1 = '1'.charCodeAt(0)

const calcCode = (size, tokenSize, dataView, seed = 0) => {
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
  tag = Math.floor(getTimestamp()).toString(36), // /^\w*$/ only, public visible
  size = 64 * 1024, // in byte, 32 based
  tokenSize = 8, // in byte, max 13byte, 32bit (limited by calc step `Math.pow(16, tokenSize)`)
  timeGap = 30 // in sec, min 1sec
}) => {
  if (!/^\w*$/.test(tag)) throw new Error(`invalid tag: ${tag}`)
  if (!Number.isInteger(size) || size % 32) throw new Error(`invalid size: ${size}`)
  if (!Number.isInteger(tokenSize) || tokenSize > 13 || tokenSize < 2) throw new Error(`invalid tokenSize: ${tokenSize}`)
  if (!Number.isInteger(timeGap) || timeGap < 1) throw new Error(`invalid timeGap: ${timeGap}`)
  return { tag, size, tokenSize, timeGap }
}

const generateCheckCode = (
  { tag, size, tokenSize, timeGap, dataView },
  timestamp = getTimestamp()
) => {
  const seed = Math.ceil(timestamp / timeGap)
  __DEV__ && console.log('generateCheckCode', tokenSize, timeGap, timestamp, seed)
  const code = calcCode(size, tokenSize, dataView, seed)
  __DEV__ && console.log('generateCheckCode', code)
  return swapObfuscateString(`${tag}${CHECK_CODE_SEP}${seed.toString(36)}${CHECK_CODE_SEP}${code}`)
}

const verifyCheckCode = (
  { tag, size, tokenSize, timeGap, dataView },
  checkCode,
  timestamp = getTimestamp()
) => {
  if (typeof (checkCode) !== 'string' || checkCode.length < tokenSize) throw new Error(`invalid checkCode: ${checkCode}`)
  __DEV__ && console.log('verifyCheckCode', tokenSize, timeGap, checkCode, timestamp)
  const [ tagString, seedString, codeString ] = swapObfuscateString(checkCode).split(CHECK_CODE_SEP)
  if (tagString !== tag) throw new Error(`tag not match: ${tagString}, expected: ${tag}`)
  const seed = Number.parseInt(seedString, 36)
  if (Math.abs(timestamp / timeGap - seed) > 1) throw new Error(`seed time not match: ${seed}, expected: ${timestamp / timeGap}±1`)
  const code = calcCode(size, tokenSize, dataView, seed)
  if (code !== codeString) throw new Error(`code not match: ${codeString}, expected: ${code}`)
}

const generateLookupData = (option) => {
  option = verifyOption(option)
  return { ...option, dataView: new DataView(getRandomArrayBuffer(option.size)) }
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
  generateCheckCode,
  verifyCheckCode,
  generateLookupData,
  packDataArrayBuffer,
  parseDataArrayBuffer
}
