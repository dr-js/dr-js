// @ts-check

import { includes, strictEqual, truthy } from 'source/common/verify.js'
import {
  getRandomInt,
  getRandomIntList, getRandomWithinList,
  getRandomId, getRandomId62, getRandomId62S,
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

  it('getRandomWithinList()', () => {
    strictEqual(getRandomWithinList([], 10).length, [].length)
    strictEqual(getRandomWithinList([ 1 ], 10).length, [ 1 ].length)
    strictEqual(getRandomWithinList([ 1, 2 ], 10).length, [ 1, 2 ].length)
    strictEqual(getRandomWithinList([ 1, 2, 3 ], 0).length, [].length)
    strictEqual(getRandomWithinList([ 1, 2, 3 ], 1).length, [ 3 ].length)
    strictEqual(getRandomWithinList([ 1, 2, 3 ], 2).length, [ 1, 2 ].length)
    strictEqual(getRandomWithinList([ 1, 2, 3 ], 3).length, [ 1, 2, 3 ].length)
    strictEqual(getRandomWithinList([ 1, 2, 3 ], -3).length, [].length)
  })

  it('getRandomId()', () => {
    truthy(getRandomId('[abc]').startsWith('[abc]'))
    includes(getRandomId(), '-')
  })

  it('getRandomId62()', () => {
    truthy(getRandomId62('[abc]').startsWith('[abc]'))
    includes(getRandomId62('+'), '+')
  })

  it('getRandomId62S()', () => {
    truthy(getRandomId62S('[abc]').startsWith('[abc]'))
    includes(getRandomId62S('+'), '+')
  })

  it('getRandomArrayBuffer()', () => {
    strictEqual(getRandomArrayBuffer(1 << 1).byteLength, 1 << 1)
    strictEqual(getRandomArrayBuffer(1 << 8).byteLength, 1 << 8)
    strictEqual(getRandomArrayBuffer(1 << 16).byteLength, 1 << 16)
    strictEqual(getRandomArrayBuffer(1 << 24).byteLength, 1 << 24)
  })
})
