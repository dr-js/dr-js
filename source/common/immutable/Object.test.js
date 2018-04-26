import { strictEqual,deepEqual, notDeepEqual } from 'assert'
import {
  objectSet,
  objectDelete,
  objectMerge,
  objectPickKey
} from './Object'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.Object', () => {
  const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

  it('should pass objectSet()', () => {
    strictEqual(objectSet(OBJECT_DATA, 'a', 1), OBJECT_DATA)
    notDeepEqual(objectSet(OBJECT_DATA, 'a', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'A', SAMPLE_ARRAY), OBJECT_DATA)
    deepEqual(objectSet(OBJECT_DATA, 'A', []), OBJECT_DATA)
    notDeepEqual(objectSet(OBJECT_DATA, 'b', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'b', 2).b, 2)
    strictEqual(objectSet(OBJECT_DATA, 'b', SAMPLE_ARRAY).b, SAMPLE_ARRAY)
    deepEqual(objectSet(OBJECT_DATA, 'b', []).b, SAMPLE_ARRAY)
  })

  it('should pass objectDelete()', () => {
    notDeepEqual(objectDelete(OBJECT_DATA, 'a'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'a').a, undefined)
    notDeepEqual(objectDelete(OBJECT_DATA, 'A'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'A').A, undefined)
    strictEqual(objectDelete(OBJECT_DATA, 'b'), OBJECT_DATA)
  })

  it('should pass objectMerge()', () => {
    strictEqual(objectMerge(OBJECT_DATA, {}), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, OBJECT_DATA), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 1 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { A: SAMPLE_ARRAY }), OBJECT_DATA)
    notDeepEqual(objectMerge(OBJECT_DATA, { a: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 2 }).a, 2)
    notDeepEqual(objectMerge(OBJECT_DATA, { b: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { b: 2 }).b, 2)
  })

  it('should pass objectPickKey()', () => {
    deepEqual(objectPickKey(OBJECT_DATA, Object.keys(OBJECT_DATA)), OBJECT_DATA)
    deepEqual(objectPickKey(OBJECT_DATA, []), {})
    deepEqual(objectPickKey(OBJECT_DATA, [ 'a' ]), { a: 1 })
    deepEqual(objectPickKey(OBJECT_DATA, [ 'A' ]), { A: [] })
    deepEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b' ]), { a: 1 })
    deepEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1 ]), { a: 1 })
    deepEqual(objectPickKey(OBJECT_DATA, [ 'a', 'b', 1, 'a' ]), { a: 1 })
  })
})
