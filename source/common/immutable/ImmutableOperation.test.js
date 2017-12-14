import nodeModuleAssert from 'assert'
import {
  objectSet,
  objectDelete,
  objectMerge,

  arraySet,
  arrayDelete,
  arrayInsert,
  arrayMove,
  arrayPush,
  arrayUnshift,
  arrayPop,
  arrayShift,
  arrayConcat,
  arrayMatchPush,
  arrayMatchDelete,
  arrayMatchMove,
  arrayFindPush,
  arrayFindDelete,
  arrayFindMove,
  arrayFindSet
} from './ImmutableOperation'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.ImmutableOperation', () => {
  describe('Object Immutable Operation', () => {
    const OBJECT_DATA = { a: 1, A: SAMPLE_ARRAY }

    it('should pass objectSet()', () => {
      nodeModuleAssert.strictEqual(objectSet(OBJECT_DATA, 'a', 1), OBJECT_DATA)
      nodeModuleAssert.notStrictEqual(objectSet(OBJECT_DATA, 'a', 2), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectSet(OBJECT_DATA, 'A', SAMPLE_ARRAY), OBJECT_DATA)
      nodeModuleAssert.notStrictEqual(objectSet(OBJECT_DATA, 'A', []), OBJECT_DATA)
      nodeModuleAssert.notStrictEqual(objectSet(OBJECT_DATA, 'b', 2), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectSet(OBJECT_DATA, 'b', 2).b, 2)
      nodeModuleAssert.strictEqual(objectSet(OBJECT_DATA, 'b', SAMPLE_ARRAY).b, SAMPLE_ARRAY)
      nodeModuleAssert.notStrictEqual(objectSet(OBJECT_DATA, 'b', []).b, SAMPLE_ARRAY)
    })
    it('should pass objectDelete()', () => {
      nodeModuleAssert.notStrictEqual(objectDelete(OBJECT_DATA, 'a'), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectDelete(OBJECT_DATA, 'a').a, undefined)
      nodeModuleAssert.notStrictEqual(objectDelete(OBJECT_DATA, 'A'), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectDelete(OBJECT_DATA, 'A').A, undefined)
      nodeModuleAssert.strictEqual(objectDelete(OBJECT_DATA, 'b'), OBJECT_DATA)
    })
    it('should pass objectMerge()', () => {
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, {}), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, OBJECT_DATA), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, { a: 1 }), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, { A: SAMPLE_ARRAY }), OBJECT_DATA)
      nodeModuleAssert.notStrictEqual(objectMerge(OBJECT_DATA, { a: 2 }), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, { a: 2 }).a, 2)
      nodeModuleAssert.notStrictEqual(objectMerge(OBJECT_DATA, { b: 2 }), OBJECT_DATA)
      nodeModuleAssert.strictEqual(objectMerge(OBJECT_DATA, { b: 2 }).b, 2)
    })
  })

  describe('Array Immutable Operation', () => {
    const ARRAY_DATA = [ 'a', SAMPLE_ARRAY ]

    it('should pass arraySet()', () => {
      nodeModuleAssert.strictEqual(arraySet(ARRAY_DATA, 0, 'a'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arraySet(ARRAY_DATA, 0, 'b'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arraySet(ARRAY_DATA, 0, 'b')[ 0 ], 'b')
      nodeModuleAssert.strictEqual(arraySet(ARRAY_DATA, 10, 'b')[ 10 ], 'b')
    })
    it('should pass arrayDelete()', () => {
      nodeModuleAssert.strictEqual(arrayDelete(ARRAY_DATA, -1), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayDelete(ARRAY_DATA, 99), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayDelete(ARRAY_DATA, 0), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayDelete(ARRAY_DATA, 0)[ 0 ], SAMPLE_ARRAY)
    })
    it('should pass arrayInsert()', () => {
      nodeModuleAssert.notStrictEqual(arrayInsert(ARRAY_DATA, 0, 'I'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayInsert(ARRAY_DATA, 1, 'I'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayInsert(ARRAY_DATA, 2, 'I'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayInsert(ARRAY_DATA, 0, 'I')[ 0 ], 'I')
      nodeModuleAssert.strictEqual(arrayInsert(ARRAY_DATA, 1, 'I')[ 1 ], 'I')
      nodeModuleAssert.strictEqual(arrayInsert(ARRAY_DATA, 2, 'I')[ 2 ], 'I')
    })
    it('should pass arrayMove()', () => {
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 1, 1), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 0, 0), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMove(ARRAY_DATA, 0, 1), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMove(ARRAY_DATA, 1, 0), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 1, 0)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 1, 0)[ 1 ], 'a')
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 0, 1)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayMove(ARRAY_DATA, 0, 1)[ 1 ], 'a')
    })
    it('should pass arrayPush()', () => {
      nodeModuleAssert.notStrictEqual(arrayPush(ARRAY_DATA, 'I'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayPush(ARRAY_DATA, 'I')[ 2 ], 'I')
    })
    it('should pass arrayUnshift()', () => {
      nodeModuleAssert.notStrictEqual(arrayUnshift(ARRAY_DATA, 'I'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayUnshift(ARRAY_DATA, 'I')[ 0 ], 'I')
    })
    it('should pass arrayPop()', () => {
      nodeModuleAssert.notStrictEqual(arrayPop(ARRAY_DATA), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayPop(ARRAY_DATA)[ 0 ], 'a')
      nodeModuleAssert.notStrictEqual(arrayPop(ARRAY_DATA)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.notStrictEqual(arrayPop(ARRAY_DATA)[ 1 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayPop(ARRAY_DATA).length, 1)
    })
    it('should pass arrayShift()', () => {
      nodeModuleAssert.notStrictEqual(arrayShift(ARRAY_DATA), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayShift(ARRAY_DATA)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.notStrictEqual(arrayShift(ARRAY_DATA)[ 0 ], 'a')
      nodeModuleAssert.notStrictEqual(arrayShift(ARRAY_DATA)[ 1 ], 'a')
      nodeModuleAssert.strictEqual(arrayShift(ARRAY_DATA).length, 1)
    })
    it('should pass arrayConcat()', () => {
      nodeModuleAssert.strictEqual(arrayConcat(ARRAY_DATA, null), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayConcat(ARRAY_DATA, []), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayConcat(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayConcat(ARRAY_DATA, [ 1 ])[ 2 ], 1)
      nodeModuleAssert.strictEqual(arrayConcat(ARRAY_DATA, [ 1 ]).length, 3)
    })
    it('should pass arrayMatchPush()', () => {
      nodeModuleAssert.strictEqual(arrayMatchPush(ARRAY_DATA, 'a'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchPush(ARRAY_DATA, SAMPLE_ARRAY), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMatchPush(ARRAY_DATA, 1), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMatchPush(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchPush(ARRAY_DATA, 1)[ 2 ], 1)
      nodeModuleAssert.strictEqual(arrayMatchPush(ARRAY_DATA, 1).length, 3)
    })
    it('should pass arrayMatchDelete()', () => {
      nodeModuleAssert.notStrictEqual(arrayMatchDelete(ARRAY_DATA, 'a'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMatchDelete(ARRAY_DATA, SAMPLE_ARRAY), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchDelete(ARRAY_DATA, 1), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchDelete(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchDelete(ARRAY_DATA, 'a')[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayMatchDelete(ARRAY_DATA, 'a').length, 1)
    })
    it('should pass arrayMatchMove()', () => {
      nodeModuleAssert.notStrictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchMove(ARRAY_DATA, 0, 'a'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a').length, 2)
      nodeModuleAssert.strictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a')[ 1 ], 'a')
      nodeModuleAssert.strictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a')[ 0 ], arrayMatchMove(ARRAY_DATA, 1, 'a')[ 0 ])
      nodeModuleAssert.strictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a')[ 1 ], arrayMatchMove(ARRAY_DATA, 1, 'a')[ 1 ])
    })
    it('should pass arrayFindPush()', () => {
      nodeModuleAssert.notStrictEqual(arrayFindPush(ARRAY_DATA, (v) => v === 'F', 'F'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindPush(ARRAY_DATA, (v) => v === 'a', 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindPush(ARRAY_DATA, (v) => true, 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F')[ 2 ], 'F')
      nodeModuleAssert.strictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F').length, 3)
    })
    it('should pass arrayFindDelete()', () => {
      nodeModuleAssert.strictEqual(arrayFindDelete(ARRAY_DATA, (v) => v === 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindDelete(ARRAY_DATA, (v) => false), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindDelete(ARRAY_DATA, (v) => v === 'a'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindDelete(ARRAY_DATA, (v) => true), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindDelete(ARRAY_DATA, (v) => true)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayFindDelete(ARRAY_DATA, (v) => true).length, 1)
    })
    it('should pass arrayFindMove()', () => {
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => v === 'F', 2), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => false, 2), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindMove(ARRAY_DATA, (v) => v === 'a', 2), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 0 ], SAMPLE_ARRAY)
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 1 ], 'a')
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1).length, 2)
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2)[ 0 ], arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 0 ])
      nodeModuleAssert.strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2)[ 1 ], arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 1 ])
    })
    it('should pass arrayFindSet()', () => {
      nodeModuleAssert.strictEqual(arrayFindSet(ARRAY_DATA, (v) => v === 'F', 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindSet(ARRAY_DATA, (v) => false, 'F'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindSet(ARRAY_DATA, (v) => v === 'a', 'F'), ARRAY_DATA)
      nodeModuleAssert.notStrictEqual(arrayFindSet(ARRAY_DATA, (v) => true, 'F'), ARRAY_DATA)
      nodeModuleAssert.strictEqual(arrayFindSet(ARRAY_DATA, (v) => true, 'F')[ 0 ], 'F')
    })
  })
})
