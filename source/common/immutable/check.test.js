import { ok } from 'assert'
import {
  isObjectShallowEqual,
  isArrayShallowEqual,
  isCompactArrayShallowEqual
} from './check'

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
      ok(isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_0))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1E))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_2))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_3))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_4))
    })
    it('true', () => {
      ok(isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_1E))
      ok(isObjectShallowEqual(SAMPLE_OBJECT_1E, SAMPLE_OBJECT_1))
    })
    it('false', () => {
      ok(!isObjectShallowEqual(SAMPLE_OBJECT_0, SAMPLE_OBJECT_1))
      ok(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_0))

      ok(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_2))
      ok(!isObjectShallowEqual(SAMPLE_OBJECT_2, SAMPLE_OBJECT_1))

      ok(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_3))
      ok(!isObjectShallowEqual(SAMPLE_OBJECT_3, SAMPLE_OBJECT_1))

      ok(!isObjectShallowEqual(SAMPLE_OBJECT_1, SAMPLE_OBJECT_4))
      ok(!isObjectShallowEqual(SAMPLE_OBJECT_4, SAMPLE_OBJECT_1))
    })
  })

  describe('isArrayShallowEqual()', () => {
    it('self', () => {
      ok(isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4))
    })
    it('true', () => {
      ok(isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E))
      ok(isArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1))
    })
    it('false', () => {
      ok(!isArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1))
      ok(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0))

      ok(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2))
      ok(!isArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1))

      ok(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3))
      ok(!isArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1))

      ok(!isArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4))
      ok(!isArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1))
    })
  })

  describe('isCompactArrayShallowEqual()', () => {
    it('self', () => {
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_0))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1E))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_2))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_3))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_4))
    })
    it('true', () => {
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_1E))
      ok(isCompactArrayShallowEqual(SAMPLE_ARRAY_1E, SAMPLE_ARRAY_1))
    })
    it('false', () => {
      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_0, SAMPLE_ARRAY_1))
      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_0))

      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_2))
      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_2, SAMPLE_ARRAY_1))

      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_3))
      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_3, SAMPLE_ARRAY_1))

      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_1, SAMPLE_ARRAY_4))
      ok(!isCompactArrayShallowEqual(SAMPLE_ARRAY_4, SAMPLE_ARRAY_1))
    })
  })
})
