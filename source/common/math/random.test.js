import { ok, equal } from 'assert'
import {
  getRandomInt,
  getRandomIntList,
  getRandomId,
  getRandomArrayBuffer
} from './random'

const { describe, it } = global

describe('Common.Math.Random', () => {
  it('getRandomInt()', () => {
    equal(getRandomInt(0), 0)
    equal(getRandomInt(10, 10), 10)
    ok(getRandomInt(8, 10) <= 10, true)
    ok(getRandomInt(8, 10) <= 10, true)
    ok(getRandomInt(8, 10) >= 8, true)
    ok(getRandomInt(8, 10) >= 8, true)
  })

  it('getRandomIntList()', () => {
    equal(getRandomIntList(0, 10, 2).length, 2)
    equal(getRandomIntList(0, 10, 4).length, 4)
    equal(getRandomIntList(0, 10, 6).length, 6)
  })

  it('getRandomId()', () => {
    ok(getRandomId('[abc]').startsWith('[abc]'))
    ok(getRandomId().includes('-'))
  })

  it('getRandomArrayBuffer()', () => {
    equal(getRandomArrayBuffer(1 << 1).byteLength, 1 << 1)
    equal(getRandomArrayBuffer(1 << 8).byteLength, 1 << 8)
    equal(getRandomArrayBuffer(1 << 16).byteLength, 1 << 16)
    equal(getRandomArrayBuffer(1 << 24).byteLength, 1 << 24)
  })
})
