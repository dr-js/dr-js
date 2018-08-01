import { ok, strictEqual, notStrictEqual, throws } from 'assert'
import { getTimestamp } from 'source/common/time'
import { isObjectContain } from 'source/common/check'
import { swapObfuscateString } from 'source/common/data/function'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer'
import {
  verifyOption,
  generateLookupData,
  generateCheckCode,
  verifyCheckCode,
  packDataArrayBuffer,
  parseDataArrayBuffer
} from './TimedLookup'

const { describe, it } = global

describe('Common.Module.TimedLookup', () => {
  const defaultOption = verifyOption({})
  const defaultLookupData = generateLookupData(defaultOption)

  it('verifyOption()', () => {
    const defaultCheckOption = { ...defaultOption }
    delete defaultCheckOption.tag

    throws(() => verifyOption(), 'should throw when no option')
    throws(() => verifyOption({ tag: 'a-a' }), 'should throw on invalid tag')
    throws(() => verifyOption({ size: 0 }), 'should throw on invalid size')
    throws(() => verifyOption({ size: 1024 + 1 }), 'should throw on invalid size')
    throws(() => verifyOption({ tokenSize: 0 }), 'should throw on invalid tokenSize')
    throws(() => verifyOption({ tokenSize: 1 }), 'should throw on invalid tokenSize')
    throws(() => verifyOption({ tokenSize: 14 }), 'should throw on invalid tokenSize')
    throws(() => verifyOption({ tokenSize: 3.5 }), 'should throw on invalid tokenSize')
    throws(() => verifyOption({ timeGap: 0 }), 'should throw on invalid timeGap')
    throws(() => verifyOption({ timeGap: 2.5 }), 'should throw on invalid timeGap')

    ok(isObjectContain(verifyOption({}), defaultCheckOption))
    ok(isObjectContain(verifyOption(defaultCheckOption), defaultCheckOption))

    ok(isObjectContain(verifyOption({ tag: '' }), { ...defaultCheckOption, tag: '' }))
    ok(isObjectContain(verifyOption({ tag: 'aA1_zZ0' }), { ...defaultCheckOption, tag: 'aA1_zZ0' }))

    ok(isObjectContain(verifyOption({ size: 1024 + 32 }), { ...defaultCheckOption, size: 1024 + 32 }))
    ok(isObjectContain(verifyOption({ size: 1024 * 1024 }), { ...defaultCheckOption, size: 1024 * 1024 }))

    ok(isObjectContain(verifyOption({ tokenSize: 2 }), { ...defaultCheckOption, tokenSize: 2 }))
    ok(isObjectContain(verifyOption({ tokenSize: 9 }), { ...defaultCheckOption, tokenSize: 9 }))
    ok(isObjectContain(verifyOption({ tokenSize: 13 }), { ...defaultCheckOption, tokenSize: 13 }))

    ok(isObjectContain(verifyOption({ timeGap: 1 }), { ...defaultCheckOption, timeGap: 1 }))
    ok(isObjectContain(verifyOption({ timeGap: 10 }), { ...defaultCheckOption, timeGap: 10 }))
    ok(isObjectContain(verifyOption({ timeGap: 3600 }), { ...defaultCheckOption, timeGap: 3600 }))
  })

  it('generateLookupData()', () => {
    ok(!isEqualArrayBuffer(defaultLookupData.dataView.buffer, generateLookupData(defaultOption).dataView.buffer))
    ok(!isEqualArrayBuffer(defaultLookupData.dataView.buffer, generateLookupData(defaultOption).dataView.buffer))
  })

  it('generateCheckCode()', () => {
    const timestamp = getTimestamp()
    strictEqual(generateCheckCode(defaultLookupData, 0), generateCheckCode(defaultLookupData, 0))
    strictEqual(generateCheckCode(defaultLookupData, timestamp), generateCheckCode(defaultLookupData, timestamp))
    notStrictEqual(generateCheckCode(defaultLookupData, 0), generateCheckCode(defaultLookupData, 1))
    notStrictEqual(generateCheckCode(defaultLookupData, 0), generateCheckCode(generateLookupData(defaultOption), 0))
  })

  it('verifyCheckCode()', () => {
    const checkCode0 = generateCheckCode(defaultLookupData, 0)
    const checkCodeTimestamp = generateCheckCode(defaultLookupData)

    verifyCheckCode(defaultLookupData, checkCode0, 0)
    verifyCheckCode(defaultLookupData, checkCodeTimestamp)

    throws(() => verifyCheckCode(defaultLookupData, checkCode0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, 0), 'should throw on invalid checkCode')

    throws(() => verifyCheckCode(defaultLookupData, 0, 0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, '', 0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, '---', 0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, 'aaa-bbb-ccc', 0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, 'aaa-bbb-ccc-ddd', 0), 'should throw on invalid checkCode')
  })

  it('packDataArrayBuffer/parseDataArrayBuffer', () => {
    const arrayBufferPacket = packDataArrayBuffer(defaultLookupData)
    const { dataView: parsedDataView, ...parsedOption } = parseDataArrayBuffer(arrayBufferPacket)

    ok(isObjectContain(defaultLookupData, parsedOption))
    ok(isEqualArrayBuffer(defaultLookupData.dataView.buffer, parsedDataView.buffer))

    const repackedArrayBufferPacket = packDataArrayBuffer({ dataView: parsedDataView, ...parsedOption })

    ok(isEqualArrayBuffer(arrayBufferPacket, repackedArrayBufferPacket))
  })

  it('LEGACY: patch for old implementation', () => { // TODO: LEGACY
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

    const generateCheckCodeLegacy = (
      { tag, size, tokenSize, timeGap, dataView },
      timestamp = getTimestamp()
    ) => {
      const seed = Math.ceil(timestamp / timeGap)
      const code = calcCode(size, tokenSize, dataView, seed)
      return swapObfuscateString(`${tag}${CHECK_CODE_SEP}${seed.toString(36)}${CHECK_CODE_SEP}${code}`)
    }

    const checkCodeLegacy0 = generateCheckCodeLegacy(defaultLookupData, 0)
    const checkCodeLegacyTimestamp = generateCheckCodeLegacy(defaultLookupData)

    verifyCheckCode(defaultLookupData, checkCodeLegacy0, 0)
    verifyCheckCode(defaultLookupData, checkCodeLegacyTimestamp)
  })
})
