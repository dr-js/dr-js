import { ok, strictEqual, notStrictEqual, throws } from 'assert'
import { getTimestamp } from 'source/common/time'
import { isObjectContain } from 'source/common/check'
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
    const timestamp = getTimestamp()
    const checkCode0 = generateCheckCode(defaultLookupData, 0)
    const checkCodeTimestamp = generateCheckCode(defaultLookupData, timestamp)

    verifyCheckCode(defaultLookupData, checkCode0, 0)
    verifyCheckCode(defaultLookupData, checkCode0, 0 + defaultLookupData.timeGap)
    verifyCheckCode(defaultLookupData, checkCode0, 0 - defaultLookupData.timeGap)

    verifyCheckCode(defaultLookupData, checkCodeTimestamp)
    verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp + defaultLookupData.timeGap)
    verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp - defaultLookupData.timeGap)

    throws(() => verifyCheckCode(defaultLookupData, checkCode0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, checkCode0, 0 + 1 + defaultLookupData.timeGap), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, checkCode0, 0 - 1 - defaultLookupData.timeGap), 'should throw on invalid checkCode')

    throws(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, 0), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp + 1 + defaultLookupData.timeGap), 'should throw on invalid checkCode')
    throws(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp - 1 - defaultLookupData.timeGap), 'should throw on invalid checkCode')

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
})
