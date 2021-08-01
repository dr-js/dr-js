import { doThrow, stringifyEqual, strictEqual } from 'source/common/verify.js'
import {
  debounce,
  throttle,
  // once,
  lossyAsync,
  withCache, withCacheAsync,
  withDelayArgvQueue,
  withRepeat, withRepeatAsync,
  withRetry, withRetryAsync,
  withTimeoutAsync, withTimeoutPromise,
  createInsideOutPromise
} from './function.js'
import { setTimeoutAsync } from './time.js'

const { describe, it } = globalThis

const TIME_WAIT_SCALE = process.platform !== 'darwin' ? 1 : 10 // TODO: NOTE: macos fs watcher event seems to be both batched and late than linux/win32, so just wait longer

describe('Common.Function', () => {
  it('debounce()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let debouncedValue = null
    const debouncedFunc = debounce((value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      debouncedValue = value
    }, 20)

    const test = async () => {
      debouncedValue = null
      debouncedFunc('Not 1')
      debouncedValue !== null && reject(new Error('debouncedFunc should not be called yet'))
      debouncedFunc('Not 2')
      debouncedValue !== null && reject(new Error('debouncedFunc should not be called yet'))
      await setTimeoutAsync(10)
      debouncedValue !== null && reject(new Error('debouncedFunc should not be called yet'))
      debouncedFunc('Not 3')
      debouncedValue !== null && reject(new Error('debouncedFunc should not be called yet'))
      debouncedFunc('Good')
      await setTimeoutAsync(20)
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should get called in time'))
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
    }, 20, true)

    const test = async () => {
      debouncedValue = null
      debouncedFunc('Good')
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should get called in time'))
      debouncedFunc('Not 1')
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should not be called during waiting'))
      debouncedFunc('Not 2')
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should not be called during waiting'))
      await setTimeoutAsync(10)
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should not be called during waiting'))
      debouncedFunc('Not 3')
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should not be called during waiting'))
      await setTimeoutAsync(20)
      debouncedValue !== 'Good' && reject(new Error('debouncedFunc should not be called during waiting'))
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
    }, 20)

    const test = async () => {
      throttledValue = null
      throttledFunc('Good')
      throttledValue !== null && reject(new Error('throttledFunc should not be called yet'))
      throttledFunc('Not 1')
      throttledValue !== null && reject(new Error('throttledFunc should not be called yet'))
      throttledFunc('Not 2')
      throttledValue !== null && reject(new Error('throttledFunc should not be called yet'))
      await setTimeoutAsync(10)
      throttledValue !== null && reject(new Error('throttledFunc should not be called yet'))
      throttledFunc('Not 3')
      throttledValue !== null && reject(new Error('throttledFunc should not be called yet'))
      await setTimeoutAsync(20)
      throttledValue !== 'Good' && reject(new Error('throttledFunc should get called in time'))
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
    }, 20, true)

    const test = async () => {
      throttledValue = null
      throttledFunc('Good')
      throttledValue !== 'Good' && reject(new Error('throttledFunc should get called in time'))
      throttledFunc('Not 1')
      throttledValue !== 'Good' && reject(new Error('throttledFunc should not be called during waiting'))
      throttledFunc('Not 2')
      throttledValue !== 'Good' && reject(new Error('throttledFunc should not be called during waiting'))
      await setTimeoutAsync(10)
      throttledValue !== 'Good' && reject(new Error('throttledFunc should not be called during waiting'))
      throttledFunc('Not 3')
      throttledValue !== 'Good' && reject(new Error('throttledFunc should not be called during waiting'))
      await setTimeoutAsync(20)
      throttledValue !== 'Good' && reject(new Error('throttledFunc should not be called during waiting'))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('lossyAsync()', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let testValue = null
    const { trigger, getRunningPromise } = lossyAsync(async (value) => {
      value !== 'Good' && reject(new Error(`expect value === 'Good' but get: ${value}`))
      testValue = value
      await setTimeoutAsync(10)
      testValue = 'DONE'
      throw new Error('should be dropped')
    }, (error) => error) // drop error

    const test = async () => {
      testValue = null
      getRunningPromise() && reject(new Error('asyncFunc should not be running'))
      trigger('Good')
      !getRunningPromise() && reject(new Error('asyncFunc should be running'))
      testValue !== 'Good' && reject(new Error('asyncFunc should get called in time'))
      trigger('Not 1')
      testValue !== 'Good' && reject(new Error('asyncFunc should not be called during waiting'))
      trigger('Not 2')
      testValue !== 'Good' && reject(new Error('asyncFunc should not be called during waiting'))
      !getRunningPromise() && reject(new Error('asyncFunc should be running'))
      await setTimeoutAsync(20)
      testValue !== 'DONE' && reject(new Error('asyncFunc should not be called during waiting'))
    }

    await test() // 1st try
    await test() // 2nd try
    resolve() // done
    return promise
  })

  it('withCache/withCacheAsync()', async () => {
    const TEST_VALUE = {}
    const getValue = withCache(() => TEST_VALUE)
    strictEqual(getValue(), TEST_VALUE)
    const getValueAsync = withCacheAsync(async () => TEST_VALUE)
    strictEqual(await getValueAsync(), TEST_VALUE)
  })

  it('withDelayArgvQueue() debounce', async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    let delayedValue = null
    const delayedFunc = withDelayArgvQueue((value) => {
      delayedValue !== null && reject(new Error(`expect delayedValue === null but get: ${delayedValue}`))
      delayedValue = value
    }, debounce, 20)

    const test = async () => {
      delayedValue = null
      delayedFunc('Not 1')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Not 2')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      await setTimeoutAsync(10)
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Not 3')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Good')
      await setTimeoutAsync(20)
      !Array.isArray(delayedValue) && reject(new Error('delayedFunc should get called in time'))
      stringifyEqual(delayedValue, [ [ 'Not 1' ], [ 'Not 2' ], [ 'Not 3' ], [ 'Good' ] ])
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
    }, throttle, 20)

    const test = async () => {
      delayedValue = null
      delayedFunc('Good')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Not 1')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Not 2')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      await setTimeoutAsync(10)
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      delayedFunc('Not 3')
      delayedValue !== null && reject(new Error('delayedFunc should not be called yet'))
      await setTimeoutAsync(20)
      !Array.isArray(delayedValue) && reject(new Error('delayedFunc should get called in time'))
      stringifyEqual(delayedValue, [ [ 'Good' ], [ 'Not 1' ], [ 'Not 2' ], [ 'Not 3' ] ])
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

  it('withRepeatAsync()', async () => {
    let repeatSum = 0
    let repeatCount = 0
    await withRepeatAsync(async (looped, count) => {
      await setTimeoutAsync(5)
      strictEqual(repeatCount, looped)
      strictEqual(5, count)
      repeatCount++
      repeatSum += looped
    }, 5)
    strictEqual(repeatSum, 0 + 1 + 2 + 3 + 4)
    strictEqual(repeatCount, 5)
  })

  it('withRetry()', async () => {
    const createCallCheck = ({ expectFail, expectMaxRetry }) => {
      let called = 0
      return {
        checkFunc: (failed, maxRetry) => {
          if (expectMaxRetry !== maxRetry) throw new Error(`[createCallCheck] expectMaxRetry: ${expectMaxRetry}, maxRetry: ${maxRetry}`)
          if (called !== failed) throw new Error(`[createCallCheck] called: ${called}, failed: ${failed}`)
          if (called > expectFail) throw new Error(`[createCallCheck] called: ${called}, expectFail: ${expectFail}`)
          if (called !== expectFail) {
            called++
            throw new Error(`[createCallCheck] called: ${called}`)
          }
        }
      }
    }

    {
      const { checkFunc } = createCallCheck({ expectFail: 4, expectMaxRetry: Infinity })
      withRetry(checkFunc)
    }

    {
      const { checkFunc } = createCallCheck({ expectFail: 4, expectMaxRetry: 5 })
      withRetry(checkFunc, 5)
    }

    {
      const { checkFunc } = createCallCheck({ expectFail: 4, expectMaxRetry: 3 })
      doThrow(() => withRetry(checkFunc, 3), 'error expected when maxRetry is reached')
    }
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
        () => { throw new Error('error expected when maxRetry is reached') },
        (error) => `Expected Error: ${error}`
      )
    }
  })

  it('withTimeoutAsync()', async () => {
    await withTimeoutAsync( // no timeout, no promise/async
      () => {},
      10
    )

    await withTimeoutAsync( // no timeout
      () => setTimeoutAsync(10),
      20 * TIME_WAIT_SCALE
    )

    await withTimeoutAsync( // with timeout // NOTE: not designed to catch normal function (will throw before await)
      async () => { throw new Error('AAA') },
      10
    ).then(
      () => { throw new Error('should reject with error') },
      () => 'Good Error'
    )

    await withTimeoutAsync( // with timeout
      () => setTimeoutAsync(20 * TIME_WAIT_SCALE),
      10
    ).then(
      () => { throw new Error('should reject with timeout') },
      () => 'Good Error'
    )
  })

  it('withTimeoutPromise()', async () => {
    const expectResult = {}
    await withTimeoutPromise( // no timeout
      Promise.resolve(expectResult),
      10
    ).then((result) => { if (result !== expectResult) throw new Error(`unexpected result: ${result}`) })

    const expectError = new Error('expect error')
    await withTimeoutPromise( // no timeout
      Promise.reject(expectError),
      10
    ).then(
      () => { throw new Error('should reject with timeout') },
      (error) => { if (error !== expectError) throw new Error(`unexpected Error: ${error}`) }
    )

    await withTimeoutPromise( // no timeout
      setTimeoutAsync(10),
      20 * TIME_WAIT_SCALE
    )

    await withTimeoutPromise( // with timeout
      setTimeoutAsync(20 * TIME_WAIT_SCALE),
      10
    ).then(
      () => { throw new Error('should reject with timeout') },
      (error) => {
        // __DEV__ && console.log(`error.stack: ${error.stack}`)
        strictEqual(
          String(error.stack).split('\n').length >= 6, // testing line count, check: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
          true,
          `error from "withTimeoutPromise()" should have longer stack trace, get: ${error.stack}`
        )
        return 'Good Error'
      }
    )
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
      (value) => { throw new Error(`should not resolve with value: ${value}`) },
      (error) => strictEqual(error.message, 'Good Error')
    )
  })
})
