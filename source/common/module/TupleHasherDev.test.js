import { strictEqual } from 'source/common/verify.js'
import { getRandomInt } from 'source/common/math/random.js'
import { createTupleHasher } from './TupleHasherDev.js'

const { describe, it } = global

describe('Common.Module.TupleHasher', () => {
  const initialId = getRandomInt(2, 99)

  it('createTupleHasher()', () => {
    const hasher = createTupleHasher(initialId)

    // allow different length
    strictEqual(hasher.hash(1, 2, 3), initialId)
    strictEqual(hasher.hash(1, 2), initialId + 1)
    strictEqual(hasher.hash(1), initialId + 2)

    // use === to test
    strictEqual(hasher.hash([]), initialId + 3)
    strictEqual(hasher.hash([]), initialId + 4)
    strictEqual(hasher.hash([]), initialId + 5)

    // check old tuple with `hashList`
    strictEqual(hasher.hashList([ 1, 2, 3 ]), initialId)
    strictEqual(hasher.hashList([ 1, 2 ]), initialId + 1)
    strictEqual(hasher.hashList([ 1 ]), initialId + 2)

    // clear should reset id
    hasher.clear()
    strictEqual(hasher.hash(1), initialId)
  })
})
