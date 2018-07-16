import { equal, deepEqual } from 'assert'
import {
  getSample,
  getSampleRange,
  getSampleRate
} from './sample'

const { describe, it } = global

describe('Common.Math.Sample', () => {
  it('getSample()', () => {
    equal(getSample((i) => 0, 0).length, 0)
    equal(getSample((i) => 0, 2).length, 2)
    equal(getSample((i) => 0, 24).length, 24)
    deepEqual(getSample((i) => 0, 6), [ 0, 0, 0, 0, 0, 0 ])
    deepEqual(getSample((i) => i, 6), [ 0, 1, 2, 3, 4, 5 ])
  })

  it('getSampleRange()', () => {
    equal(getSampleRange(0, 0).length, 1)
    equal(getSampleRange(10, 10).length, 1)
    equal(getSampleRange(-10, -10).length, 1)

    equal(getSampleRange(0, 24).length, 25)
    equal(getSampleRange(-10, 10).length, 21)

    deepEqual(getSampleRange(0, 3), [ 0, 1, 2, 3 ])
    deepEqual(getSampleRange(-2, 2), [ -2, -1, 0, 1, 2 ])
  })

  it('getSampleRate()', () => {
    equal(getSampleRate(1).length, 2)
    equal(getSampleRate(3).length, 4)
    equal(getSampleRate(6).length, 7)

    deepEqual(getSampleRate(1), [ 0, 1 ])
    deepEqual(getSampleRate(2), [ 0, 0.5, 1 ])
    deepEqual(getSampleRate(3), [ 0, 1 / 3, 2 / 3, 1 ])
  })
})
