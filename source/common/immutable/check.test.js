import { strictEqual } from 'source/common/verify.js'
import {
  isObjectShallowEqual,
  isArrayShallowEqual,
  isCompactArrayShallowEqual
} from './check.js'

const { describe, it } = global

const SAMPLE_OBJECT_0 = {}
const SAMPLE_OBJECT_1 = { a: {}, b: 1, c: 'A', d: SAMPLE_OBJECT_0 }
const SAMPLE_OBJECT_1E = { ...SAMPLE_OBJECT_1 }
const SAMPLE_OBJECT_2 = { ...SAMPLE_OBJECT_1, e: {} }
const SAMPLE_OBJECT_3 = { a: {}, b: 1, c: 'A', d: {} }
const SAMPLE_OBJECT_4 = { a: {}, b: 1, c: 'A', e: {} }

const SAMPLE_ARRAY_0 = []
const SAMPLE_ARRAY_1 = [ 1, '?', {}, SAMPLE_ARRAY_0 ]
const SAMPLE_ARRAY_1E = [ ...SAMPLE_ARRAY_1 ]
const SAMPLE_ARRAY_2 = [ ...SAMPLE_ARRAY_1, 0 ]
const SAMPLE_ARRAY_3 = [ 1, '?', {}, [] ]
const SAMPLE_ARRAY_4 = [ 1, '?', {}, SAMPLE_ARRAY_0 ]
SAMPLE_ARRAY_4[ 50 ] = ''

describe('Common.Immutable.Check', () => {
  describe('isObjectShallowEqual()', () => {
    it('self', () => {
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_0), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1E), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_2), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_3), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_4), true)
    })
    it('true', () => {
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1E), true)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1), true)
    })
    it('false', () => {
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_1), false)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_0), false)

      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_2), false)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_1), false)

      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_3), false)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_1), false)

      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_4), false)
      strictEqual(isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_1), false)
    })
  })

  describe('isArrayShallowEqual()', () => {
    it('self', () => {
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4), true)
    })
    it('true', () => {
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E), true)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1), true)
    })
    it('false', () => {
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1), false)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0), false)

      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2), false)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1), false)

      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3), false)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1), false)

      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4), false)
      strictEqual(isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1), false)
    })
  })

  describe('isCompactArrayShallowEqual()', () => {
    it('self', () => {
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4), true)
    })
    it('true', () => {
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E), true)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1), true)
    })
    it('false', () => {
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1), false)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0), false)

      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2), false)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1), false)

      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3), false)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1), false)

      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4), false)
      strictEqual(isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1), false)
    })
  })
})
