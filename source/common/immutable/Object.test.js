import { strictEqual, deepStrictEqual, notDeepStrictEqual } from 'assert'
import {
  objectSet,
  objectDelete,
  objectMerge,
  objectMap,
  objectPickKey,
  objectDeleteUndefined
} from './Object'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.Object', () => {
  const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

  it('should pass objectSet()', () => {
    strictEqual(objectSet(OBJECT_DATA, 'a', 1), OBJECT_DATA)
    notDeepStrictEqual(objectSet(OBJECT_DATA, 'a', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'A', SAMPLE_ARRAY), OBJECT_DATA)
    deepStrictEqual(objectSet(OBJECT_DATA, 'A', []), OBJECT_DATA)
    notDeepStrictEqual(objectSet(OBJECT_DATA, 'b', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'b', 2).b, 2)
    strictEqual(objectSet(OBJECT_DATA, 'b', SAMPLE_ARRAY).b, SAMPLE_ARRAY)
    deepStrictEqual(objectSet(OBJECT_DATA, 'b', []).b, SAMPLE_ARRAY)
  })

  it('should pass objectDelete()', () => {
    notDeepStrictEqual(objectDelete(OBJECT_DATA, 'a'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'a').a, undefined)
    notDeepStrictEqual(objectDelete(OBJECT_DATA, 'A'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'A').A, undefined)
    strictEqual(objectDelete(OBJECT_DATA, 'b'), OBJECT_DATA)
  })

  it('should pass objectMerge()', () => {
    strictEqual(objectMerge(OBJECT_DATA, {}), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, OBJECT_DATA), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 1 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { A: SAMPLE_ARRAY }), OBJECT_DATA)
    notDeepStrictEqual(objectMerge(OBJECT_DATA, { a: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 2 }).a, 2)
    notDeepStrictEqual(objectMerge(OBJECT_DATA, { b: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { b: 2 }).b, 2)
  })

  it('should pass objectMap()', () => {
    deepStrictEqual(objectMap(OBJECT_DATA, (v) => v), OBJECT_DATA)
    deepStrictEqual(objectMap(OBJECT_DATA, (v) => typeof (v)), { a: 'number', A: 'object' })
    deepStrictEqual(objectMap(OBJECT_DATA, (v, key) => key), { a: 'a', A: 'A' })
    deepStrictEqual(objectMap(OBJECT_DATA, () => OBJECT_DATA), { a: OBJECT_DATA, A: OBJECT_DATA })
    deepStrictEqual(objectMap({}, () => OBJECT_DATA), {})
  })

  it('should pass objectPickKey()', () => {
    deepStrictEqual(objectPickKey(OBJECT_DATA, Object.keys(OBJECT_DATA)), OBJECT_DATA)
    deepStrictEqual(objectPickKey(OBJECT_DATA, []), {})
    deepStrictEqual(objectPickKey(OBJECT_DATA, [ 'a' ]), { a: 1 })
    deepStrictEqual(objectPickKey(OBJECT_DATA, [ 'A' ]), { A: [] })
    deepStrictEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b' ]), { a: 1 })
    deepStrictEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1 ]), { a: 1 })
    deepStrictEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1, 'a' ]), { a: 1 })
  })

  it('should pass objectDeleteUndefined()', () => {
    deepStrictEqual(objectDeleteUndefined(OBJECT_DATA), OBJECT_DATA)
    deepStrictEqual(objectDeleteUndefined({}), {})
    deepStrictEqual(objectDeleteUndefined({ c: undefined, d: undefined }), {})
    deepStrictEqual(objectDeleteUndefined({ ...OBJECT_DATA, c: undefined, d: undefined }), OBJECT_DATA)
  })
})
