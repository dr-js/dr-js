import { truthy } from 'source/common/verify.js'
import { createLoopIndex } from './LoopIndex.js'

const { describe, it } = globalThis

describe('Common.Data.LoopIndex', () => {
  it('isReached()', () => {
    const { LOOP_INDEX_MAX, isReached } = createLoopIndex()

    truthy(isReached(1, 0))
    truthy(isReached(1, 1))
    truthy(!isReached(1, 2))

    truthy(isReached(2, 1))
    truthy(isReached(2, 2))
    truthy(isReached(2, LOOP_INDEX_MAX))

    truthy(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX - 2))
    truthy(isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX - 1))
    truthy(!isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX))
    truthy(!isReached(LOOP_INDEX_MAX - 1, 0))
    truthy(!isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX + 1))
    truthy(!isReached(LOOP_INDEX_MAX - 1, 1))
    truthy(!isReached(LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX + 2))
    truthy(!isReached(LOOP_INDEX_MAX - 1, 2))
  })
})
