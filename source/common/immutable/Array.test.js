import { strictEqual, notDeepStrictEqual } from 'assert'
import {
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
} from './Array'

const { describe, it } = global

const SAMPLE_ARRAY = []

describe('Common.Immutable.Array', () => {
  const ARRAY_DATA = [ 'a', SAMPLE_ARRAY ]

  it('should pass arraySet()', () => {
    strictEqual(arraySet(ARRAY_DATA, 0, 'a'), ARRAY_DATA)
    notDeepStrictEqual(arraySet(ARRAY_DATA, 0, 'b'), ARRAY_DATA)
    strictEqual(arraySet(ARRAY_DATA, 0, 'b')[ 0 ], 'b')
    strictEqual(arraySet(ARRAY_DATA, 10, 'b')[ 10 ], 'b')
  })
  it('should pass arrayDelete()', () => {
    strictEqual(arrayDelete(ARRAY_DATA, -1), ARRAY_DATA)
    strictEqual(arrayDelete(ARRAY_DATA, 99), ARRAY_DATA)
    notDeepStrictEqual(arrayDelete(ARRAY_DATA, 0), ARRAY_DATA)
    strictEqual(arrayDelete(ARRAY_DATA, 0)[ 0 ], SAMPLE_ARRAY)
  })
  it('should pass arrayInsert()', () => {
    notDeepStrictEqual(arrayInsert(ARRAY_DATA, 0, 'I'), ARRAY_DATA)
    notDeepStrictEqual(arrayInsert(ARRAY_DATA, 1, 'I'), ARRAY_DATA)
    notDeepStrictEqual(arrayInsert(ARRAY_DATA, 2, 'I'), ARRAY_DATA)
    strictEqual(arrayInsert(ARRAY_DATA, 0, 'I')[ 0 ], 'I')
    strictEqual(arrayInsert(ARRAY_DATA, 1, 'I')[ 1 ], 'I')
    strictEqual(arrayInsert(ARRAY_DATA, 2, 'I')[ 2 ], 'I')
  })
  it('should pass arrayMove()', () => {
    strictEqual(arrayMove(ARRAY_DATA, 1, 1), ARRAY_DATA)
    strictEqual(arrayMove(ARRAY_DATA, 0, 0), ARRAY_DATA)
    notDeepStrictEqual(arrayMove(ARRAY_DATA, 0, 1), ARRAY_DATA)
    notDeepStrictEqual(arrayMove(ARRAY_DATA, 1, 0), ARRAY_DATA)
    strictEqual(arrayMove(ARRAY_DATA, 1, 0)[ 0 ], SAMPLE_ARRAY)
    strictEqual(arrayMove(ARRAY_DATA, 1, 0)[ 1 ], 'a')
    strictEqual(arrayMove(ARRAY_DATA, 0, 1)[ 0 ], SAMPLE_ARRAY)
    strictEqual(arrayMove(ARRAY_DATA, 0, 1)[ 1 ], 'a')
  })
  it('should pass arrayPush()', () => {
    notDeepStrictEqual(arrayPush(ARRAY_DATA, 'I'), ARRAY_DATA)
    strictEqual(arrayPush(ARRAY_DATA, 'I')[ 2 ], 'I')
  })
  it('should pass arrayUnshift()', () => {
    notDeepStrictEqual(arrayUnshift(ARRAY_DATA, 'I'), ARRAY_DATA)
    strictEqual(arrayUnshift(ARRAY_DATA, 'I')[ 0 ], 'I')
  })
  it('should pass arrayPop()', () => {
    notDeepStrictEqual(arrayPop(ARRAY_DATA), ARRAY_DATA)
    strictEqual(arrayPop(ARRAY_DATA)[ 0 ], 'a')
    notDeepStrictEqual(arrayPop(ARRAY_DATA)[ 0 ], SAMPLE_ARRAY)
    notDeepStrictEqual(arrayPop(ARRAY_DATA)[ 1 ], SAMPLE_ARRAY)
    strictEqual(arrayPop(ARRAY_DATA).length, 1)
  })
  it('should pass arrayShift()', () => {
    notDeepStrictEqual(arrayShift(ARRAY_DATA), ARRAY_DATA)
    strictEqual(arrayShift(ARRAY_DATA)[ 0 ], SAMPLE_ARRAY)
    notDeepStrictEqual(arrayShift(ARRAY_DATA)[ 0 ], 'a')
    notDeepStrictEqual(arrayShift(ARRAY_DATA)[ 1 ], 'a')
    strictEqual(arrayShift(ARRAY_DATA).length, 1)
  })
  it('should pass arrayConcat()', () => {
    strictEqual(arrayConcat(ARRAY_DATA, null), ARRAY_DATA)
    strictEqual(arrayConcat(ARRAY_DATA, []), ARRAY_DATA)
    notDeepStrictEqual(arrayConcat(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
    strictEqual(arrayConcat(ARRAY_DATA, [ 1 ])[ 2 ], 1)
    strictEqual(arrayConcat(ARRAY_DATA, [ 1 ]).length, 3)
  })
  it('should pass arrayMatchPush()', () => {
    strictEqual(arrayMatchPush(ARRAY_DATA, 'a'), ARRAY_DATA)
    strictEqual(arrayMatchPush(ARRAY_DATA, SAMPLE_ARRAY), ARRAY_DATA)
    notDeepStrictEqual(arrayMatchPush(ARRAY_DATA, 1), ARRAY_DATA)
    notDeepStrictEqual(arrayMatchPush(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
    strictEqual(arrayMatchPush(ARRAY_DATA, 1)[ 2 ], 1)
    strictEqual(arrayMatchPush(ARRAY_DATA, 1).length, 3)
  })
  it('should pass arrayMatchDelete()', () => {
    notDeepStrictEqual(arrayMatchDelete(ARRAY_DATA, 'a'), ARRAY_DATA)
    notDeepStrictEqual(arrayMatchDelete(ARRAY_DATA, SAMPLE_ARRAY), ARRAY_DATA)
    strictEqual(arrayMatchDelete(ARRAY_DATA, 1), ARRAY_DATA)
    strictEqual(arrayMatchDelete(ARRAY_DATA, [ 1 ]), ARRAY_DATA)
    strictEqual(arrayMatchDelete(ARRAY_DATA, 'a')[ 0 ], SAMPLE_ARRAY)
    strictEqual(arrayMatchDelete(ARRAY_DATA, 'a').length, 1)
  })
  it('should pass arrayMatchMove()', () => {
    notDeepStrictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a'), ARRAY_DATA)
    notDeepStrictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a'), ARRAY_DATA)
    strictEqual(arrayMatchMove(ARRAY_DATA, 0, 'a'), ARRAY_DATA)
    strictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a').length, 2)
    strictEqual(arrayMatchMove(ARRAY_DATA, 1, 'a')[ 1 ], 'a')
    strictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a')[ 0 ], arrayMatchMove(ARRAY_DATA, 1, 'a')[ 0 ])
    strictEqual(arrayMatchMove(ARRAY_DATA, 2, 'a')[ 1 ], arrayMatchMove(ARRAY_DATA, 1, 'a')[ 1 ])
  })
  it('should pass arrayFindPush()', () => {
    notDeepStrictEqual(arrayFindPush(ARRAY_DATA, (v) => v === 'F', 'F'), ARRAY_DATA)
    notDeepStrictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F'), ARRAY_DATA)
    strictEqual(arrayFindPush(ARRAY_DATA, (v) => v === 'a', 'F'), ARRAY_DATA)
    strictEqual(arrayFindPush(ARRAY_DATA, (v) => true, 'F'), ARRAY_DATA)
    strictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F')[ 2 ], 'F')
    strictEqual(arrayFindPush(ARRAY_DATA, (v) => false, 'F').length, 3)
  })
  it('should pass arrayFindDelete()', () => {
    strictEqual(arrayFindDelete(ARRAY_DATA, (v) => v === 'F'), ARRAY_DATA)
    strictEqual(arrayFindDelete(ARRAY_DATA, (v) => false), ARRAY_DATA)
    notDeepStrictEqual(arrayFindDelete(ARRAY_DATA, (v) => v === 'a'), ARRAY_DATA)
    notDeepStrictEqual(arrayFindDelete(ARRAY_DATA, (v) => true), ARRAY_DATA)
    strictEqual(arrayFindDelete(ARRAY_DATA, (v) => true)[ 0 ], SAMPLE_ARRAY)
    strictEqual(arrayFindDelete(ARRAY_DATA, (v) => true).length, 1)
  })
  it('should pass arrayFindMove()', () => {
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => v === 'F', 2), ARRAY_DATA)
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => false, 2), ARRAY_DATA)
    notDeepStrictEqual(arrayFindMove(ARRAY_DATA, (v) => v === 'a', 2), ARRAY_DATA)
    notDeepStrictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2), ARRAY_DATA)
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 0 ], SAMPLE_ARRAY)
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 1 ], 'a')
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 1).length, 2)
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2)[ 0 ], arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 0 ])
    strictEqual(arrayFindMove(ARRAY_DATA, (v) => true, 2)[ 1 ], arrayFindMove(ARRAY_DATA, (v) => true, 1)[ 1 ])
  })
  it('should pass arrayFindSet()', () => {
    strictEqual(arrayFindSet(ARRAY_DATA, (v) => v === 'F', 'F'), ARRAY_DATA)
    strictEqual(arrayFindSet(ARRAY_DATA, (v) => false, 'F'), ARRAY_DATA)
    notDeepStrictEqual(arrayFindSet(ARRAY_DATA, (v) => v === 'a', 'F'), ARRAY_DATA)
    notDeepStrictEqual(arrayFindSet(ARRAY_DATA, (v) => true, 'F'), ARRAY_DATA)
    strictEqual(arrayFindSet(ARRAY_DATA, (v) => true, 'F')[ 0 ], 'F')
  })
})
