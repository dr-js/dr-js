import { strictEqual, stringifyEqual } from 'source/common/verify.js'
import { createInsideOutPromise } from 'source/common/function.js'
import { catchPromise } from 'source/common/error.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { createAsyncFuncQueue } from './AsyncFuncQueue.js'

const { describe, it } = globalThis

describe('source/common/module/AsyncFuncQueue', () => {
  it('basic usage', async () => {
    const asyncFuncQueue = createAsyncFuncQueue()

    const result0 = 0
    const result1 = 1
    const result4 = undefined

    const testList = []
    const { promise, resolve } = createInsideOutPromise()

    const promise0 = asyncFuncQueue.push(() => promise) // hold up for test
    const promise1 = asyncFuncQueue.push(async () => 1)
    const promise2 = asyncFuncQueue.push(async (notPrevResult) => { testList.push(notPrevResult) }) // no result passing
    const promise3 = asyncFuncQueue.push(() => {}) // allow normal func
    const promise4 = asyncFuncQueue.push(() => { testList.push(2) })

    strictEqual(asyncFuncQueue.getLength(), 5)
    resolve(0)
    await promise
    strictEqual(asyncFuncQueue.getLength(), 5) // the first is not out of the queue yet

    strictEqual(await promise0, result0)
    strictEqual(asyncFuncQueue.getLength(), 4) // the first is out of the queue

    strictEqual(await promise1, result1)
    strictEqual(asyncFuncQueue.getLength(), 3) // the second is out of the queue

    strictEqual(await promise4, result4) // wait queue resolve to tail
    await Promise.resolve() // and one more tick to clear func out of the queue
    strictEqual(asyncFuncQueue.getLength(), 0)

    stringifyEqual(testList, [ undefined, 2 ])

    await Promise.all([ promise0, promise1, promise2, promise3, promise4 ]) // make linter happy
  })

  it('error passing', async () => {
    const asyncFuncQueue = createAsyncFuncQueue()

    const error0 = new Error('from reject')
    const error1 = new Error('from Promise.reject')
    const error2 = new Error('from async throw')
    const error3 = new Error('from sync throw')

    const { promise, reject } = createInsideOutPromise()

    const promise0 = asyncFuncQueue.push(() => promise) // hold up for test
    const promise1 = asyncFuncQueue.push(async () => Promise.reject(error1))
    const promise2 = asyncFuncQueue.push(async () => { throw error2 })
    const promise3 = asyncFuncQueue.push(() => { throw error3 })

    strictEqual(asyncFuncQueue.getLength(), 4)
    reject(error0)

    strictEqual((await catchPromise(promise0)).error, error0)
    strictEqual(asyncFuncQueue.getLength(), 3)
    strictEqual((await catchPromise(promise1)).error, error1)
    strictEqual(asyncFuncQueue.getLength(), 2)
    strictEqual((await catchPromise(promise2)).error, error2)
    strictEqual(asyncFuncQueue.getLength(), 1)
    strictEqual((await catchPromise(promise3)).error, error3)
    strictEqual(asyncFuncQueue.getLength(), 0)
  })

  it('queue reset', async () => {
    const asyncFuncQueue = createAsyncFuncQueue()

    const testList = []
    const { promise, resolve } = createInsideOutPromise()

    const promise0 = asyncFuncQueue.push(() => promise) // hold up for test
    const promise1 = asyncFuncQueue.push(async () => { testList.push(1) })
    const promise2 = asyncFuncQueue.push(async () => { testList.push(2) })
    const promise3 = asyncFuncQueue.push(async () => { testList.push(3) })
    const promise4 = asyncFuncQueue.push(async () => { testList.push(4) })

    strictEqual(asyncFuncQueue.getLength(), 5)

    asyncFuncQueue.reset()
    strictEqual(asyncFuncQueue.getLength(), 0) // all previous should be dropped

    resolve(0) // the first func is start running before reset, so it will complete
    await promise
    await promise0
    strictEqual(asyncFuncQueue.getLength(), 0)

    strictEqual(await Promise.race([
      /* promise0, */ promise1, promise2, promise3, promise4, // no follow-up queue func should get called
      setTimeoutAsync(16).then(() => 'timeout')
    ]), 'timeout')
    stringifyEqual(testList, []) // no follow-up queue func should get called
  })
})
