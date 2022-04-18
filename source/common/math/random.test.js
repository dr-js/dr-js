import { includes, strictEqual, truthy } from 'source/common/verify.js'
import {
  getRandomInt,
  getRandomIntList,
  getRandomId, getRandomId62,
  getRandomArrayBuffer
} from './random.js'

const { describe, it } = globalThis

describe('Common.Math.Random', () => {
  it('getRandomInt()', () => {
    strictEqual(getRandomInt(0), 0)
    strictEqual(getRandomInt(10, 10), 10)
    truthy(getRandomInt(8, 10) <= 10)
    truthy(getRandomInt(8, 10) <= 10)
    truthy(getRandomInt(8, 10) >= 8)
    truthy(getRandomInt(8, 10) >= 8)
  })

  it('getRandomIntList()', () => {
    strictEqual(getRandomIntList(0, 10, 2).length, 2)
    strictEqual(getRandomIntList(0, 10, 4).length, 4)
    strictEqual(getRandomIntList(0, 10, 6).length, 6)
  })

  it('getRandomId()', () => {
    truthy(getRandomId('[abc]').startsWith('[abc]'))
    includes(getRandomId(), '-')
  })

  it('getRandomId62()', () => {
    truthy(getRandomId62('[abc]').startsWith('[abc]'))
    includes(getRandomId62('+'), '+')
  })

  it('getRandomArrayBuffer()', () => {
    strictEqual(getRandomArrayBuffer(1 << 1).byteLength, 1 << 1)
    strictEqual(getRandomArrayBuffer(1 << 8).byteLength, 1 << 8)
    strictEqual(getRandomArrayBuffer(1 << 16).byteLength, 1 << 16)
    strictEqual(getRandomArrayBuffer(1 << 24).byteLength, 1 << 24)
  })
})
