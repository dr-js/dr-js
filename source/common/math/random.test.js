import { ok, strictEqual } from 'assert'
import {
  getRandomInt,
  getRandomIntList,
  getRandomId,
  getRandomArrayBuffer
} from './random'

const { describe, it } = global

describe('Common.Math.Random', () => {
  it('getRandomInt()', () => {
    strictEqual(getRandomInt(0), 0)
    strictEqual(getRandomInt(10, 10), 10)
    ok(getRandomInt(8, 10) <= 10, true)
    ok(getRandomInt(8, 10) <= 10, true)
    ok(getRandomInt(8, 10) >= 8, true)
    ok(getRandomInt(8, 10) >= 8, true)
  })

  it('getRandomIntList()', () => {
    strictEqual(getRandomIntList(0, 10, 2).length, 2)
    strictEqual(getRandomIntList(0, 10, 4).length, 4)
    strictEqual(getRandomIntList(0, 10, 6).length, 6)
  })

  it('getRandomId()', () => {
    ok(getRandomId('[abc]').startsWith('[abc]'))
    ok(getRandomId().includes('-'))
  })

  it('getRandomArrayBuffer()', () => {
    strictEqual(getRandomArrayBuffer(1 << 1).byteLength, 1 << 1)
    strictEqual(getRandomArrayBuffer(1 << 8).byteLength, 1 << 8)
    strictEqual(getRandomArrayBuffer(1 << 16).byteLength, 1 << 16)
    strictEqual(getRandomArrayBuffer(1 << 24).byteLength, 1 << 24)
  })
})
