import { strictEqual, stringifyEqual, notStringifyEqual } from 'source/common/verify'
import {
  objectSet,
  objectDelete,
  objectMerge,
  objectMap,
  objectPickKey,
  objectFindKey,
  objectFilter
} from './Object'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.Object', () => {
  const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

  it('should pass objectSet()', () => {
    strictEqual(objectSet(OBJECT_DATA, 'a', 1), OBJECT_DATA)
    notStringifyEqual(objectSet(OBJECT_DATA, 'a', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'A', SAMPLE_ARRAY), OBJECT_DATA)
    stringifyEqual(objectSet(OBJECT_DATA, 'A', []), OBJECT_DATA)
    notStringifyEqual(objectSet(OBJECT_DATA, 'b', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'b', 2).b, 2)
    strictEqual(objectSet(OBJECT_DATA, 'b', SAMPLE_ARRAY).b, SAMPLE_ARRAY)
    stringifyEqual(objectSet(OBJECT_DATA, 'b', []).b, SAMPLE_ARRAY)
  })

  it('should pass objectDelete()', () => {
    notStringifyEqual(objectDelete(OBJECT_DATA, 'a'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'a').a, undefined)
    notStringifyEqual(objectDelete(OBJECT_DATA, 'A'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'A').A, undefined)
    strictEqual(objectDelete(OBJECT_DATA, 'b'), OBJECT_DATA)
  })

  it('should pass objectMerge()', () => {
    strictEqual(objectMerge(OBJECT_DATA, {}), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, OBJECT_DATA), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 1 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { A: SAMPLE_ARRAY }), OBJECT_DATA)
    notStringifyEqual(objectMerge(OBJECT_DATA, { a: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 2 }).a, 2)
    notStringifyEqual(objectMerge(OBJECT_DATA, { b: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { b: 2 }).b, 2)
  })

  it('should pass objectMap()', () => {
    stringifyEqual(objectMap(OBJECT_DATA, (v) => v), OBJECT_DATA)
    stringifyEqual(objectMap(OBJECT_DATA, (v) => typeof (v)), { a: 'number', A: 'object' })
    stringifyEqual(objectMap(OBJECT_DATA, (v, key) => key), { a: 'a', A: 'A' })
    stringifyEqual(objectMap(OBJECT_DATA, () => OBJECT_DATA), { a: OBJECT_DATA, A: OBJECT_DATA })
    stringifyEqual(objectMap({}, () => OBJECT_DATA), {})
  })

  it('should pass objectPickKey()', () => {
    stringifyEqual(objectPickKey(OBJECT_DATA, Object.keys(OBJECT_DATA)), OBJECT_DATA)
    stringifyEqual(objectPickKey(OBJECT_DATA, []), {})
    stringifyEqual(objectPickKey(OBJECT_DATA, [ 'a' ]), { a: 1 })
    stringifyEqual(objectPickKey(OBJECT_DATA, [ 'A' ]), { A: [] })
    stringifyEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b' ]), { a: 1 })
    stringifyEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1 ]), { a: 1 })
    stringifyEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1, 'a' ]), { a: 1 })
  })

  it('should pass objectFindKey()', () => {
    stringifyEqual(objectFindKey(OBJECT_DATA, () => true), Object.keys(OBJECT_DATA)[ 0 ])
    stringifyEqual(objectFindKey(OBJECT_DATA, () => false), undefined)
    stringifyEqual(objectFindKey(OBJECT_DATA, ([ value, key ], index) => index === 1), Object.keys(OBJECT_DATA)[ 1 ])
    stringifyEqual(objectFindKey({}, () => true), undefined)
  })

  it('should pass objectFilter()', () => {
    stringifyEqual(objectFilter(OBJECT_DATA, () => true), OBJECT_DATA)
    stringifyEqual(objectFilter(OBJECT_DATA, (value) => value === 1), { a: 1 })
    stringifyEqual(objectFilter(OBJECT_DATA, () => false), {})
    stringifyEqual(objectFilter({}, () => true), {})
    stringifyEqual(objectFilter({ c: undefined, d: undefined }, () => true), { c: undefined, d: undefined })
    stringifyEqual(objectFilter({ c: undefined, d: undefined }, (value) => value !== undefined), {})
    stringifyEqual(objectFilter({ ...OBJECT_DATA, c: undefined, d: undefined }, (value) => value !== undefined), OBJECT_DATA)
  })
})
