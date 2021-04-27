import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import {
  getSample,
  getSampleRange,
  getSampleRate
} from './sample.js'

const { describe, it } = global

describe('Common.Math.Sample', () => {
  it('getSample()', () => {
    strictEqual(getSample((i) => 0, 0).length, 0)
    strictEqual(getSample((i) => 0, 2).length, 2)
    strictEqual(getSample((i) => 0, 24).length, 24)
    stringifyEqual(getSample((i) => 0, 6), [ 0, 0, 0, 0, 0, 0 ])
    stringifyEqual(getSample((i) => i, 6), [ 0, 1, 2, 3, 4, 5 ])
  })

  it('getSampleRange()', () => {
    strictEqual(getSampleRange(0, 0).length, 1)
    strictEqual(getSampleRange(10, 10).length, 1)
    strictEqual(getSampleRange(-10, -10).length, 1)

    strictEqual(getSampleRange(0, 24).length, 25)
    strictEqual(getSampleRange(-10, 10).length, 21)

    stringifyEqual(getSampleRange(0, 3), [ 0, 1, 2, 3 ])
    stringifyEqual(getSampleRange(-2, 2), [ -2, -1, 0, 1, 2 ])
  })

  it('getSampleRate()', () => {
    strictEqual(getSampleRate(1).length, 2)
    strictEqual(getSampleRate(3).length, 4)
    strictEqual(getSampleRate(6).length, 7)

    stringifyEqual(getSampleRate(1), [ 0, 1 ])
    stringifyEqual(getSampleRate(2), [ 0, 0.5, 1 ])
    stringifyEqual(getSampleRate(3), [ 0, 1 / 3, 2 / 3, 1 ])
  })
})
