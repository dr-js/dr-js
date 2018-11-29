import { strictEqual, notStrictEqual, stringifyEqual } from 'source/common/verify'
import {
  hashStringToNumber,
  tryParseJSONObject,
  getValueByKeyList
} from './function'

const { describe, it } = global

const SAMPLE_ARRAY = []
const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

describe('Common.Data.function', () => {
  it('hashStringToNumber()', () => {
    strictEqual(hashStringToNumber('a'), hashStringToNumber('a'))
    notStrictEqual(hashStringToNumber('a'), hashStringToNumber('b'))
    notStrictEqual(hashStringToNumber('a'), hashStringToNumber('aa'))
    notStrictEqual(hashStringToNumber('a'), hashStringToNumber('a '))
    notStrictEqual(hashStringToNumber('a'), hashStringToNumber('a', 1))
    notStrictEqual(hashStringToNumber('a'), hashStringToNumber('a', 9))
  })

  it('tryParseJSONObject()', () => {
    stringifyEqual(tryParseJSONObject(JSON.stringify(OBJECT_DATA)), OBJECT_DATA)
    stringifyEqual(tryParseJSONObject(''), {})
    stringifyEqual(tryParseJSONObject('a'), {})
    stringifyEqual(tryParseJSONObject('"a"'), {})
    stringifyEqual(tryParseJSONObject('1'), {})
    stringifyEqual(tryParseJSONObject('[]'), [])
    strictEqual(tryParseJSONObject('', OBJECT_DATA), OBJECT_DATA)
  })

  it('getValueByKeyList()', () => {
    strictEqual(getValueByKeyList(OBJECT_DATA, []), OBJECT_DATA)
    strictEqual(getValueByKeyList(OBJECT_DATA, [ 'a' ]), 1)
    strictEqual(getValueByKeyList(OBJECT_DATA, [ 'A' ]), SAMPLE_ARRAY)
    strictEqual(getValueByKeyList(OBJECT_DATA, [ 'A', 1 ]), undefined)
    strictEqual(getValueByKeyList(OBJECT_DATA, [ 1 ]), undefined)
  })
})
