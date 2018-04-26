import { deepEqual, strictEqual } from 'assert'
import {
  debounce,
  throttle,
  lossyAsync,
  withDelayArgvQueue,
  withRepeat,
  withRetryAsync,
  createInsideOutPromise,
  promiseQueue
} from './function'
import { setTimeoutAsync } from './time'

const { describe, it } = global

describe('Common.Function', () => {
  it('debounce()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let debouncedValue = null
    const debouncedFunc = debounce((value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      debouncedValue = value
    }, 50)

    const test = async () => {
      debouncedValue = null
      debouncedFunc('Not 1')
      debouncedValue !== null && reject(new Error(`debouncedFunc should not be called yet`))
      debouncedFunc('Not 2')
      debouncedValue !== null && reject(new Error(`debouncedFunc should not be called yet`))
      await setTimeoutAsync(10)
      debouncedValue !== null && reject(new Error(`debouncedFunc should not be called yet`))
      debouncedFunc('Not 3')
      debouncedValue !== null && reject(new Error(`debouncedFunc should not be called yet`))
      debouncedFunc('Good')
      await setTimeoutAsync(100)
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should get called in time`))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('debounce() isLeadingEdge', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let debouncedValue = null
    const debouncedFunc = debounce((value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      debouncedValue = value
    }, 50, true)

    const test = async () => {
      debouncedValue = null
      debouncedFunc('Good')
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should get called in time`))
      debouncedFunc('Not 1')
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should not be called during waiting`))
      debouncedFunc('Not 2')
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should not be called during waiting`))
      await setTimeoutAsync(10)
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should not be called during waiting`))
      debouncedFunc('Not 3')
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should not be called during waiting`))
      await setTimeoutAsync(100)
      debouncedValue !== 'Good' && reject(new Error(`debouncedFunc should not be called during waiting`))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('throttle()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let throttledValue = null
    const throttledFunc = throttle((value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      throttledValue = value
    }, 50)

    const test = async () => {
      throttledValue = null
      throttledFunc('Good')
      throttledValue !== null && reject(new Error(`throttledFunc should not be called yet`))
      throttledFunc('Not 1')
      throttledValue !== null && reject(new Error(`throttledFunc should not be called yet`))
      throttledFunc('Not 2')
      throttledValue !== null && reject(new Error(`throttledFunc should not be called yet`))
      await setTimeoutAsync(10)
      throttledValue !== null && reject(new Error(`throttledFunc should not be called yet`))
      throttledFunc('Not 3')
      throttledValue !== null && reject(new Error(`throttledFunc should not be called yet`))
      await setTimeoutAsync(100)
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should get called in time`))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('throttle() isLeadingEdge', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let throttledValue = null
    const throttledFunc = throttle((value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      throttledValue = value
    }, 50, true)

    const test = async () => {
      throttledValue = null
      throttledFunc('Good')
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should get called in time`))
      throttledFunc('Not 1')
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should not be called during waiting`))
      throttledFunc('Not 2')
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should not be called during waiting`))
      await setTimeoutAsync(10)
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should not be called during waiting`))
      throttledFunc('Not 3')
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should not be called during waiting`))
      await setTimeoutAsync(100)
      throttledValue !== 'Good' && reject(new Error(`throttledFunc should not be called during waiting`))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('lossyAsync()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let testValue = null
    const lossyAsyncFunc = lossyAsync(async (value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      testValue = value
      await setTimeoutAsync(10)
      testValue = 'DONE'
      throw new Error('should be dropped')
    }, (error) => error) // drop error

    const test = async () => {
      testValue = null
      lossyAsyncFunc('Good')
      testValue !== 'Good' && reject(new Error(`asyncFunc should get called in time`))
      lossyAsyncFunc('Not 1')
      testValue !== 'Good' && reject(new Error(`asyncFunc should not be called during waiting`))
      lossyAsyncFunc('Not 2')
      testValue !== 'Good' && reject(new Error(`asyncFunc should not be called during waiting`))
      await setTimeoutAsync(20)
      testValue !== 'DONE' && reject(new Error(`asyncFunc should not be called during waiting`))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('withDelayArgvQueue() debounce', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let delayedValue = null
    const delayedFunc = withDelayArgvQueue((value) => {
      delayedValue !== null && reject(new Error(`expect delayedValue === null but get: ${delayedValue}`))
      delayedValue = value
    }, debounce, 50)

    const test = async () => {
      delayedValue = null
      delayedFunc('Not 1')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Not 2')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      await setTimeoutAsync(10)
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Not 3')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Good')
      await setTimeoutAsync(100)
      !Array.isArray(delayedValue) && reject(new Error(`delayedFunc should get called in time`))
      deepEqual(delayedValue, [ [ 'Not 1' ], [ 'Not 2' ], [ 'Not 3' ], [ 'Good' ] ])
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('withDelayArgvQueue() throttle', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let delayedValue = null
    const delayedFunc = withDelayArgvQueue((value) => {
      delayedValue !== null && reject(new Error(`expect delayedValue === null but get: ${delayedValue}`))
      delayedValue = value
    }, throttle, 50)

    const test = async () => {
      delayedValue = null
      delayedFunc('Good')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Not 1')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Not 2')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      await setTimeoutAsync(10)
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      delayedFunc('Not 3')
      delayedValue !== null && reject(new Error(`delayedFunc should not be called yet`))
      await setTimeoutAsync(100)
      !Array.isArray(delayedValue) && reject(new Error(`delayedFunc should get called in time`))
      deepEqual(delayedValue, [ [ 'Good' ], [ 'Not 1' ], [ 'Not 2' ], [ 'Not 3' ] ])
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('withRepeat()', () => {
    let repeatSum = 0
    let repeatCount = 0
    withRepeat((looped, count) => {
      strictEqual(repeatCount, looped)
      strictEqual(5, count)
      repeatCount++
      repeatSum += looped
    }, 5)
    strictEqual(repeatSum, 0 + 1 + 2 + 3 + 4)
    strictEqual(repeatCount, 5)
  })

  it('withRetryAsync()', async () => {
    const createCallCheck = ({ expectFail, expectMaxRetry }) => {
      const { promise, resolve, reject } = createInsideOutPromise()
      let called = 0
      return {
        checkFunc: (failed, maxRetry) => {
          if (expectMaxRetry !== maxRetry) reject(new Error(`[createCallCheck] expectMaxRetry: ${expectMaxRetry}, maxRetry: ${maxRetry}`))
          if (called !== failed) reject(new Error(`[createCallCheck] called: ${called}, failed: ${failed}`))
          if (called > expectFail) reject(new Error(`[createCallCheck] called: ${called}, expectFail: ${expectFail}`))
          if (called === expectFail) { // done
            setTimeout(resolve, 10) // check if has more calls
          } else {
            called++
            throw new Error(`[createCallCheck] called: ${called}`)
          }
        },
        promise
      }
    }

    {
      const { checkFunc, promise } = createCallCheck({ expectFail: 4, expectMaxRetry: Infinity })
      await withRetryAsync(checkFunc)
      await promise
    }

    {
      const { checkFunc, promise } = createCallCheck({ expectFail: 4, expectMaxRetry: 5 })
      await withRetryAsync(checkFunc, 5)
      await promise
    }

    {
      const { checkFunc } = createCallCheck({ expectFail: 4, expectMaxRetry: 3 })
      await withRetryAsync(checkFunc, 3).then(
        () => { throw new Error(`error expected when maxRetry is reached`) },
        (error) => `Expected Error: ${error}`
      )
    }
  })

  it('createInsideOutPromise() resolve', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()
    resolve('Good')
    resolve('Bad')
    reject(new Error('should not reject after resolve'))
    reject(new Error('should not reject after reject'))
    strictEqual(await promise, 'Good')
  })

  it('createInsideOutPromise() reject', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()
    reject(new Error('Good Error'))
    resolve('Bad')
    resolve('Bad Bad')
    reject(new Error('should not reject after reject'))
    await promise.then(
      (value) => new Error(`should not resolve with value: ${value}`),
      (error) => strictEqual(error.message, 'Good Error')
    )
  })

  // shouldContinueOnError
  it('promiseQueue()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()
    const expectedError = new Error('Expected Error')
    let state = ''

    const asyncTaskList = [
      async () => 0,
      async () => {
        strictEqual(state, 'Queue started')
        state = 'AsyncTask 1 started'
        await setTimeoutAsync(50)
        return 1
      },
      async () => { throw expectedError },
      async () => {
        reject()
        return 3
      },
      async () => {
        reject()
        return 4
      }
    ]

    const promiseQueuePromise = promiseQueue({ asyncTaskList })

    strictEqual(state, '')
    state = 'Queue started'

    setTimeoutAsync(100).then(() => reject(new Error(`promiseQueue should finish in time`)))

    const { resultList, errorList, endList, pendingList } = await promiseQueuePromise

    resolve()
    await promise // time check

    deepEqual([ ...resultList ], [ 0, 1 ])
    deepEqual([ ...errorList ], [ undefined, undefined, expectedError ])
    deepEqual(endList, asyncTaskList.slice(0, 3))
    deepEqual(pendingList, asyncTaskList.slice(3))
  })

  it('promiseQueue() shouldContinueOnError', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()
    const expectedError = new Error('Expected Error')
    let state = ''

    const asyncTaskList = [
      async () => 0,
      async () => {
        strictEqual(state, 'Queue started')
        state = 'AsyncTask 1 started'
        await setTimeoutAsync(50)
        return 1
      },
      async () => { throw expectedError },
      async () => {
        strictEqual(state, 'AsyncTask 1 started')
        state = 'AsyncTask 2 started'
        await setTimeoutAsync(10)
        return 3
      },
      async () => 4
    ]

    const promiseQueuePromise = promiseQueue({ asyncTaskList, shouldContinueOnError: true })

    strictEqual(state, '')
    state = 'Queue started'

    setTimeoutAsync(100).then(() => reject(new Error(`promiseQueue should finish in time`)))

    const { resultList, errorList, endList, pendingList } = await promiseQueuePromise

    resolve()
    await promise // time check

    deepEqual([ ...resultList ], [ 0, 1, undefined, 3, 4 ])
    deepEqual([ ...errorList ], [ undefined, undefined, expectedError ])
    deepEqual(endList, asyncTaskList)
    deepEqual(pendingList, [])
  })
})
