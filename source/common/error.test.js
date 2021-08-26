import { strictEqual, notIncludes } from 'source/common/verify.js'
import {
  remessageError,
  // rethrowError,
  withFallbackResult,
  withFallbackResultAsync,
  catchSync,
  catchAsync,
  catchPromise
} from './error.js'

const { describe, it } = globalThis

const TEST_VALUE_A = {}
const TEST_VALUE_B = {}
const TEST_ERROR = new Error('TEST_ERROR')
const GET_TEST_VALUE_B = () => TEST_VALUE_B
const GET_TEST_VALUE_B_ASYNC = async () => TEST_VALUE_B
const JUST_RETURN = (value) => value
const JUST_RETURN_ASYNC = async (value) => value
const JUST_THROW = () => { throw TEST_ERROR }
const JUST_THROW_ASYNC = async () => { throw TEST_ERROR }

describe('Common.Error', () => {
  it('remessageError()', () => {
    const error = new Error('1234567890')
    strictEqual(remessageError(error, 'qwertyuiop').message, 'qwertyuiop')
    notIncludes(remessageError(error, 'qwertyuiop').stack, '1234567890')
  })

  it('withFallbackResult()', () => {
    strictEqual(withFallbackResult({}, GET_TEST_VALUE_B), TEST_VALUE_B)
    strictEqual(withFallbackResult({}, JUST_RETURN, TEST_VALUE_B), TEST_VALUE_B)
    strictEqual(withFallbackResult({}, JUST_RETURN, TEST_VALUE_A), TEST_VALUE_A)
    strictEqual(withFallbackResult(TEST_VALUE_A, JUST_THROW), TEST_VALUE_A)
  })
  it('withFallbackResultAsync()', async () => {
    strictEqual(await withFallbackResultAsync({}, GET_TEST_VALUE_B), TEST_VALUE_B)
    strictEqual(await withFallbackResultAsync({}, GET_TEST_VALUE_B_ASYNC), TEST_VALUE_B)
    strictEqual(await withFallbackResultAsync({}, JUST_RETURN, TEST_VALUE_B), TEST_VALUE_B)
    strictEqual(await withFallbackResultAsync({}, JUST_RETURN_ASYNC, TEST_VALUE_B), TEST_VALUE_B)
    strictEqual(await withFallbackResultAsync({}, JUST_RETURN, TEST_VALUE_A), TEST_VALUE_A)
    strictEqual(await withFallbackResultAsync({}, JUST_RETURN_ASYNC, TEST_VALUE_A), TEST_VALUE_A)
    strictEqual(await withFallbackResultAsync(TEST_VALUE_A, JUST_THROW), TEST_VALUE_A)
    strictEqual(await withFallbackResultAsync(TEST_VALUE_A, JUST_THROW_ASYNC), TEST_VALUE_A)
  })

  it('catchSync()', () => {
    strictEqual(catchSync(GET_TEST_VALUE_B).result, TEST_VALUE_B)
    strictEqual(catchSync(GET_TEST_VALUE_B).error, undefined)
    strictEqual(catchSync(JUST_RETURN, TEST_VALUE_B).result, TEST_VALUE_B)
    strictEqual(catchSync(JUST_RETURN, TEST_VALUE_B).error, undefined)
    strictEqual(catchSync(JUST_THROW).result, undefined)
    strictEqual(catchSync(JUST_THROW).error, TEST_ERROR)
  })
  it('catchAsync()', async () => {
    strictEqual((await catchAsync(GET_TEST_VALUE_B)).result, TEST_VALUE_B)
    strictEqual((await catchAsync(GET_TEST_VALUE_B)).error, undefined)
    strictEqual((await catchAsync(GET_TEST_VALUE_B_ASYNC)).result, TEST_VALUE_B)
    strictEqual((await catchAsync(GET_TEST_VALUE_B_ASYNC)).error, undefined)
    strictEqual((await catchAsync(JUST_RETURN, TEST_VALUE_B)).result, TEST_VALUE_B)
    strictEqual((await catchAsync(JUST_RETURN, TEST_VALUE_B)).error, undefined)
    strictEqual((await catchAsync(JUST_RETURN_ASYNC, TEST_VALUE_B)).result, TEST_VALUE_B)
    strictEqual((await catchAsync(JUST_RETURN_ASYNC, TEST_VALUE_B)).error, undefined)
    strictEqual((await catchAsync(JUST_THROW)).result, undefined)
    strictEqual((await catchAsync(JUST_THROW)).error, TEST_ERROR)
    strictEqual((await catchAsync(JUST_THROW_ASYNC)).result, undefined)
    strictEqual((await catchAsync(JUST_THROW_ASYNC)).error, TEST_ERROR)
  })

  it('catchPromise()', async () => {
    strictEqual((await catchPromise(Promise.resolve(TEST_VALUE_A))).result, TEST_VALUE_A)
    strictEqual((await catchPromise(Promise.reject(TEST_ERROR))).error, TEST_ERROR)

    strictEqual((await catchPromise(GET_TEST_VALUE_B_ASYNC())).result, TEST_VALUE_B)
    strictEqual((await catchPromise(GET_TEST_VALUE_B_ASYNC())).error, undefined)
    strictEqual((await catchPromise(JUST_RETURN_ASYNC(TEST_VALUE_B))).result, TEST_VALUE_B)
    strictEqual((await catchPromise(JUST_RETURN_ASYNC(TEST_VALUE_B))).error, undefined)
    strictEqual((await catchPromise(JUST_THROW_ASYNC())).result, undefined)
    strictEqual((await catchPromise(JUST_THROW_ASYNC())).error, TEST_ERROR)
  })
})
