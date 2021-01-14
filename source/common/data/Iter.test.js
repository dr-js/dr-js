import { strictEqual, stringifyEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import {
  wrapAsync,
  createLockStepAsyncIter
} from './Iter'

const { describe, it } = global

const ITEM_0 = { a: 1 }
const ITEM_1 = { b: 2 }

describe('Common.Data.Iter', () => {
  it('createLockStepAsyncIter()', async () => {
    const LSAI = createLockStepAsyncIter()
    const result = []
    await Promise.all([
      (async () => {
        for await (const value of wrapAsync(LSAI.next)) {
          result.push(value)
        }
      })(),
      (async () => {
        await setTimeoutAsync(10)
        await LSAI.send(ITEM_0)
        await setTimeoutAsync(10)
        await LSAI.send(ITEM_1)
        await setTimeoutAsync(10)
        await LSAI.send(undefined, true)
      })()
    ])
    strictEqual(result.length, 2)
    strictEqual(result[ 0 ], ITEM_0)
    strictEqual(result[ 1 ], ITEM_1)
    stringifyEqual(await LSAI.next(), { value: undefined, done: true })
    await LSAI.send('should drop')
    stringifyEqual(await LSAI.next(), { value: undefined, done: true })
  })

  it('createLockStepAsyncIter() reverse order', async () => {
    const LSAI = createLockStepAsyncIter()
    const result = []
    await Promise.all([
      (async () => {
        await setTimeoutAsync(10)
        for await (const value of wrapAsync(LSAI.next)) {
          await setTimeoutAsync(10)
          result.push(value)
        }
      })(),
      (async () => {
        await LSAI.send(ITEM_0)
        await LSAI.send(ITEM_1)
        await LSAI.send(undefined, true)
      })()
    ])
    strictEqual(result.length, 2)
    strictEqual(result[ 0 ], ITEM_0)
    strictEqual(result[ 1 ], ITEM_1)
    stringifyEqual(await LSAI.next(), { value: undefined, done: true })
    await LSAI.send('should drop')
    stringifyEqual(await LSAI.next(), { value: undefined, done: true })
  })
})
