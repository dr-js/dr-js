import { strictEqual, notStrictEqual, doThrow, truthy } from 'source/common/verify.js'
import { getTimestamp } from 'source/common/time.js'
import { isObjectContain } from 'source/common/check.js'
import { withRepeat } from 'source/common/function.js'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer.js'
import {
  verifyOption,
  generateLookupData,
  generateCheckCode, parseCheckCode,
  verifyCheckCode,
  packDataArrayBuffer,
  parseDataArrayBuffer,
  packDataArrayBuffer2,
  parseDataArrayBuffer2
} from './TimedLookup.js'

const { describe, it } = globalThis

describe('Common.Module.TimedLookup', () => {
  const defaultOption = verifyOption({})
  const defaultLookupData = generateLookupData(defaultOption)

  it('verifyOption()', () => {
    const defaultCheckOption = { ...defaultOption }
    delete defaultCheckOption.tag

    doThrow(() => verifyOption(), 'should throw when no option')
    doThrow(() => verifyOption({ tag: 'a-a' }), 'should throw on invalid tag')
    doThrow(() => verifyOption({ size: 0 }), 'should throw on invalid size')
    doThrow(() => verifyOption({ size: 1024 + 1 }), 'should throw on invalid size')
    doThrow(() => verifyOption({ tokenSize: 0 }), 'should throw on invalid tokenSize')
    doThrow(() => verifyOption({ tokenSize: 1 }), 'should throw on invalid tokenSize')
    doThrow(() => verifyOption({ tokenSize: 14 }), 'should throw on invalid tokenSize')
    doThrow(() => verifyOption({ tokenSize: 3.5 }), 'should throw on invalid tokenSize')
    doThrow(() => verifyOption({ timeGap: 0 }), 'should throw on invalid timeGap')
    doThrow(() => verifyOption({ timeGap: 2.5 }), 'should throw on invalid timeGap')

    truthy(isObjectContain(verifyOption({}), defaultCheckOption))
    truthy(isObjectContain(verifyOption(defaultCheckOption), defaultCheckOption))

    truthy(isObjectContain(verifyOption({ tag: '' }), { ...defaultCheckOption, tag: '' }))
    truthy(isObjectContain(verifyOption({ tag: 'aA1_zZ0' }), { ...defaultCheckOption, tag: 'aA1_zZ0' }))

    truthy(isObjectContain(verifyOption({ size: 1024 + 32 }), { ...defaultCheckOption, size: 1024 + 32 }))
    truthy(isObjectContain(verifyOption({ size: 1024 * 1024 }), { ...defaultCheckOption, size: 1024 * 1024 }))

    truthy(isObjectContain(verifyOption({ tokenSize: 2 }), { ...defaultCheckOption, tokenSize: 2 }))
    truthy(isObjectContain(verifyOption({ tokenSize: 9 }), { ...defaultCheckOption, tokenSize: 9 }))
    truthy(isObjectContain(verifyOption({ tokenSize: 13 }), { ...defaultCheckOption, tokenSize: 13 }))

    truthy(isObjectContain(verifyOption({ timeGap: 1 }), { ...defaultCheckOption, timeGap: 1 }))
    truthy(isObjectContain(verifyOption({ timeGap: 10 }), { ...defaultCheckOption, timeGap: 10 }))
    truthy(isObjectContain(verifyOption({ timeGap: 3600 }), { ...defaultCheckOption, timeGap: 3600 }))
  })

  it('generateLookupData()', () => {
    truthy(!isEqualArrayBuffer(defaultLookupData.dataView.buffer, generateLookupData(defaultOption).dataView.buffer))
    truthy(!isEqualArrayBuffer(defaultLookupData.dataView.buffer, generateLookupData(defaultOption).dataView.buffer))
  })

  it('generateCheckCode()', () => {
    const timestamp = getTimestamp()
    strictEqual(generateCheckCode(defaultLookupData, 0), generateCheckCode(defaultLookupData, 0))
    strictEqual(generateCheckCode(defaultLookupData, timestamp), generateCheckCode(defaultLookupData, timestamp))

    notStrictEqual(generateCheckCode(defaultLookupData, 0), generateCheckCode(defaultLookupData, 1))
    strictEqual(parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ], parseCheckCode(generateCheckCode(defaultLookupData, 1))[ 2 ])
    strictEqual(parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ], parseCheckCode(generateCheckCode(defaultLookupData, defaultOption.timeGap - 1))[ 2 ])
    notStrictEqual(parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ], parseCheckCode(generateCheckCode(defaultLookupData, defaultOption.timeGap))[ 2 ])

    notStrictEqual(parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ], parseCheckCode(generateCheckCode(generateLookupData(defaultOption), 0))[ 2 ], 'should generate random one')

    let allowFlaky = 2
    withRepeat((looped, count) => {
      const defaultLookupData = generateLookupData(defaultOption)
      try {
        notStrictEqual(
          parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ],
          parseCheckCode(generateCheckCode(defaultLookupData, defaultOption.size * defaultOption.timeGap))[ 2 ],
          `should not loop with time: 0 - ${defaultOption.size * defaultOption.timeGap} [${looped}/${count}]`
        )
        notStrictEqual(
          parseCheckCode(generateCheckCode(defaultLookupData, 0))[ 2 ],
          parseCheckCode(generateCheckCode(defaultLookupData, (defaultOption.size - 32) * defaultOption.timeGap))[ 2 ],
          `should not loop with time: 0 - ${(defaultOption.size - 32) * defaultOption.timeGap} [${looped}/${count}]`
        )
      } catch (error) {
        if (allowFlaky <= 0) throw error
        allowFlaky--
      }
    }, 128)
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

    doThrow(() => verifyCheckCode(defaultLookupData, checkCode0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, checkCode0, 0 + 1 + defaultLookupData.timeGap), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, checkCode0, 0 - 1 - defaultLookupData.timeGap), 'should throw on invalid checkCode')

    doThrow(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, 0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp + 1 + defaultLookupData.timeGap), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, checkCodeTimestamp, timestamp - 1 - defaultLookupData.timeGap), 'should throw on invalid checkCode')

    doThrow(() => verifyCheckCode(defaultLookupData, 0, 0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, '', 0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, '---', 0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, 'aaa-bbb-ccc', 0), 'should throw on invalid checkCode')
    doThrow(() => verifyCheckCode(defaultLookupData, 'aaa-bbb-ccc-ddd', 0), 'should throw on invalid checkCode')
  })

  it('packDataArrayBuffer/parseDataArrayBuffer', () => {
    const arrayBufferPacket = packDataArrayBuffer(defaultLookupData)
    const { dataView: parsedDataView, ...parsedOption } = parseDataArrayBuffer(arrayBufferPacket)

    truthy(isObjectContain(defaultLookupData, parsedOption))
    truthy(isEqualArrayBuffer(defaultLookupData.dataView.buffer, parsedDataView.buffer))

    const repackedArrayBufferPacket = packDataArrayBuffer({ dataView: parsedDataView, ...parsedOption })

    truthy(isEqualArrayBuffer(arrayBufferPacket, repackedArrayBufferPacket))
  })

  it('packDataArrayBuffer2/parseDataArrayBuffer2', () => {
    const arrayBufferPacket = packDataArrayBuffer2(defaultLookupData)
    const { dataView: parsedDataView, ...parsedOption } = parseDataArrayBuffer2(arrayBufferPacket)

    truthy(isObjectContain(defaultLookupData, parsedOption))
    truthy(isEqualArrayBuffer(defaultLookupData.dataView.buffer, parsedDataView.buffer))

    const repackedArrayBufferPacket = packDataArrayBuffer2({ dataView: parsedDataView, ...parsedOption })

    truthy(isEqualArrayBuffer(arrayBufferPacket, repackedArrayBufferPacket))
  })
})
