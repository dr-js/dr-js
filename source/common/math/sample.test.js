import { strictEqual, deepStrictEqual } from 'assert'
import {
  getSample,
  getSampleRange,
  getSampleRate
} from './sample'

const { describe, it } = global

describe('Common.Math.Sample', () => {
  it('getSample()', () => {
    strictEqual(getSample((i) => 0, 0).length, 0)
    strictEqual(getSample((i) => 0, 2).length, 2)
    strictEqual(getSample((i) => 0, 24).length, 24)
    deepStrictEqual(getSample((i) => 0, 6), [ 0, 0, 0, 0, 0, 0 ])
    deepStrictEqual(getSample((i) => i, 6), [ 0, 1, 2, 3, 4, 5 ])
  })

  it('getSampleRange()', () => {
    strictEqual(getSampleRange(0, 0).length, 1)
    strictEqual(getSampleRange(10, 10).length, 1)
    strictEqual(getSampleRange(-10, -10).length, 1)

    strictEqual(getSampleRange(0, 24).length, 25)
    strictEqual(getSampleRange(-10, 10).length, 21)

    deepStrictEqual(getSampleRange(0, 3), [ 0, 1, 2, 3 ])
    deepStrictEqual(getSampleRange(-2, 2), [ -2, -1, 0, 1, 2 ])
  })

  it('getSampleRate()', () => {
    strictEqual(getSampleRate(1).length, 2)
    strictEqual(getSampleRate(3).length, 4)
    strictEqual(getSampleRate(6).length, 7)

    deepStrictEqual(getSampleRate(1), [ 0, 1 ])
    deepStrictEqual(getSampleRate(2), [ 0, 0.5, 1 ])
    deepStrictEqual(getSampleRate(3), [ 0, 1 / 3, 2 / 3, 1 ])
  })
})
