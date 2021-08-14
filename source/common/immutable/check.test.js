import { truthy } from 'source/common/verify.js'
import {
  isObjectShallowEqual,
  isArrayShallowEqual,
  isCompactArrayShallowEqual
} from './check.js'

const { describe, it } = globalThis

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
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_0))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1E))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_2))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_3))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_4))
    })
    it('true', () => {
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1E))
      truthy(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1))
    })
    it('false', () => {
      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_1))
      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_0))

      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_2))
      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_1))

      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_3))
      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_1))

      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_4))
      truthy(!isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_1))
    })
  })

  describe('isArrayShallowEqual()', () => {
    it('self', () => {
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4))
    })
    it('true', () => {
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E))
      truthy(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1))
    })
    it('false', () => {
      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1))
      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0))

      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2))
      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1))

      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3))
      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1))

      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4))
      truthy(!isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1))
    })
  })

  describe('isCompactArrayShallowEqual()', () => {
    it('self', () => {
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4))
    })
    it('true', () => {
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E))
      truthy(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1))
    })
    it('false', () => {
      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1))
      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0))

      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2))
      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1))

      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3))
      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1))

      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4))
      truthy(!isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1))
    })
  })
})
