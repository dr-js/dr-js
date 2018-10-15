import { strictEqual, deepStrictEqual, notDeepStrictEqual } from 'assert'
import {
  objectSet,
  objectDelete,
  objectMerge,
  objectMap,
  objectPickKey,
  objectFindKey,
  objectDeleteUndefined,
  objectDepthFirstSearch
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

  it('should pass objectFindKey()', () => {
    deepStrictEqual(objectFindKey(OBJECT_DATA, () => true), Object.keys(OBJECT_DATA)[ 0 ])
    deepStrictEqual(objectFindKey(OBJECT_DATA, () => false), undefined)
    deepStrictEqual(objectFindKey(OBJECT_DATA, ([ value, key ], index) => index === 1), Object.keys(OBJECT_DATA)[ 1 ])
    deepStrictEqual(objectFindKey({}, () => true), undefined)
  })

  it('should pass objectDeleteUndefined()', () => {
    deepStrictEqual(objectDeleteUndefined(OBJECT_DATA), OBJECT_DATA)
    deepStrictEqual(objectDeleteUndefined({}), {})
    deepStrictEqual(objectDeleteUndefined({ c: undefined, d: undefined }), {})
    deepStrictEqual(objectDeleteUndefined({ ...OBJECT_DATA, c: undefined, d: undefined }), OBJECT_DATA)
  })

  it('should pass objectDepthFirstSearch()', () => {
    {
      const checkList = []
      strictEqual(
        objectDepthFirstSearch(
          OBJECT_DATA,
          (value, key, index, level) => checkList.push([ value, key, index, level ]) && false // to collect all
        ),
        undefined
      )
      deepStrictEqual(checkList, [
        [ 1, 'a', 0, 0 ],
        [ SAMPLE_ARRAY, 'A', 1, 0 ]
      ])
    }

    {
      const testObject = {
        a0: 'a0',
        aDIVIDE: { // a1: 'a1',
          b0: 'b0',
          b1: 'b1',
          bDIVIDE: { // b2: 'b2',
            c0: 'c0',
            c1: 'c1',
            c2: 'c2',
            c3: 'c3'
          },
          b3: 'b3'
        },
        a2: 'a2',
        a3: 'a3'
      }
      const checkList = []
      strictEqual(
        objectDepthFirstSearch(
          testObject,
          (value, key, index, level) => checkList.push([ value, key, index, level ]) && false // to collect all
        ),
        undefined
      )
      deepStrictEqual(checkList, [
        [ 'a0', 'a0', 0, 0 ],
        [ testObject.aDIVIDE, 'aDIVIDE', 1, 0 ], // [ 'a1', 'a1', 1, 0 ],
        ...[
          [ 'b0', 'b0', 0, 1 ],
          [ 'b1', 'b1', 1, 1 ],
          [ testObject.aDIVIDE.bDIVIDE, 'bDIVIDE', 2, 1 ], // [ 'b2', 'b2', 2, 1 ],
          ...[
            [ 'c0', 'c0', 0, 2 ],
            [ 'c1', 'c1', 1, 2 ],
            [ 'c2', 'c2', 2, 2 ],
            [ 'c3', 'c3', 3, 2 ]
          ],
          [ 'b3', 'b3', 3, 1 ]
        ],
        [ 'a2', 'a2', 2, 0 ],
        [ 'a3', 'a3', 3, 0 ]
      ])
      deepStrictEqual(
        objectDepthFirstSearch(
          testObject,
          (value, key, index, level) => index === 2 && level === 1
        ),
        { value: testObject.aDIVIDE.bDIVIDE, key: 'bDIVIDE', index: 2, level: 1 }
      )
      deepStrictEqual(
        objectDepthFirstSearch(
          testObject,
          (value, key, index, level) => index === 1 && level === 2
        ),
        { value: 'c1', key: 'c1', index: 1, level: 2 }
      )
    }
  })
})
