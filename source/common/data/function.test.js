import { equal, notEqual, strictEqual, deepStrictEqual } from 'assert'
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
    equal(hashStringToNumber('a'), hashStringToNumber('a'))
    notEqual(hashStringToNumber('a'), hashStringToNumber('b'))
    notEqual(hashStringToNumber('a'), hashStringToNumber('aa'))
    notEqual(hashStringToNumber('a'), hashStringToNumber('a '))
    notEqual(hashStringToNumber('a'), hashStringToNumber('a', 1))
    notEqual(hashStringToNumber('a'), hashStringToNumber('a', 9))
  })

  it('tryParseJSONObject()', () => {
    deepStrictEqual(tryParseJSONObject(JSON.stringify(OBJECT_DATA)), OBJECT_DATA)
    deepStrictEqual(tryParseJSONObject(''), {})
    deepStrictEqual(tryParseJSONObject('a'), {})
    deepStrictEqual(tryParseJSONObject('"a"'), {})
    deepStrictEqual(tryParseJSONObject('1'), {})
    deepStrictEqual(tryParseJSONObject('[]'), [])
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
