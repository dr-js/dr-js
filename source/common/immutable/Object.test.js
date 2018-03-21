import { strictEqual, notStrictEqual } from 'assert'
import { objectSet, objectDelete, objectMerge } from './Object'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.Object', () => {
  const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

  it('should pass objectSet()', () => {
    strictEqual(objectSet(OBJECT_DATA, 'a', 1), OBJECT_DATA)
    notStrictEqual(objectSet(OBJECT_DATA, 'a', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'A', SAMPLE_ARRAY), OBJECT_DATA)
    notStrictEqual(objectSet(OBJECT_DATA, 'A', []), OBJECT_DATA)
    notStrictEqual(objectSet(OBJECT_DATA, 'b', 2), OBJECT_DATA)
    strictEqual(objectSet(OBJECT_DATA, 'b', 2).b, 2)
    strictEqual(objectSet(OBJECT_DATA, 'b', SAMPLE_ARRAY).b, SAMPLE_ARRAY)
    notStrictEqual(objectSet(OBJECT_DATA, 'b', []).b, SAMPLE_ARRAY)
  })
  it('should pass objectDelete()', () => {
    notStrictEqual(objectDelete(OBJECT_DATA, 'a'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'a').a, undefined)
    notStrictEqual(objectDelete(OBJECT_DATA, 'A'), OBJECT_DATA)
    strictEqual(objectDelete(OBJECT_DATA, 'A').A, undefined)
    strictEqual(objectDelete(OBJECT_DATA, 'b'), OBJECT_DATA)
  })
  it('should pass objectMerge()', () => {
    strictEqual(objectMerge(OBJECT_DATA, {}), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, OBJECT_DATA), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 1 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { A: SAMPLE_ARRAY }), OBJECT_DATA)
    notStrictEqual(objectMerge(OBJECT_DATA, { a: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { a: 2 }).a, 2)
    notStrictEqual(objectMerge(OBJECT_DATA, { b: 2 }), OBJECT_DATA)
    strictEqual(objectMerge(OBJECT_DATA, { b: 2 }).b, 2)
  })
})
