import { strictEqual } from 'source/common/verify.js'
import { createLoopIndex } from './LoopIndex.js'

const { describe, it } = globalThis

describe('Common.Data.LoopIndex', () => {
  it('isReached()', () => {
    const { LOOP_INDEX_MAX, isReached } = createLoopIndex()

    strictEqual(isReached(1, 0), true)
    strictEqual(isReached(1, 1), true)
    strictEqual(isReached(1, 2), false)

    strictEqual(isReached(2, 1), true)
    strictEqual(isReached(2, 2), true)
    strictEqual(isReached(2, LOOP_INDEX_MAX), true)

    strictEqual(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX - 2), true)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX - 1), true)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX), false)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, 0), false)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX + 1), false)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, 1), false)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX + 2), false)
    strictEqual(isReached(LOOP_INDEX_MAX - 1, 2), false)
  })
})
