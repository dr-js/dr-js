const remessageError = (error, nextMessage) => {
  if (error.message && error.stack) {
    // NOTE: patch for V8(Chrome/Nodejs), V8 will save a copy of message in the `.stack` for simpler `.toString()`
    //   but FireFox will compose correctly
    error.stack = error.stack.replace(error.message, nextMessage) // TODO: this may replace the string in stacktrace
  }
  error.message = nextMessage
  return error
}

const rethrowError = (error) => {
  console.warn(error)
  throw error
}

const withFallbackResult = (fallbackResult, func, ...args) => {
  try { return func(...args) } catch (error) {
    __DEV__ && console.log('[withFallbackResult] error:', error)
    return fallbackResult
  }
}

const withFallbackResultAsync = async (fallbackResult, func, ...args) => {
  try { return await func(...args) } catch (error) {
    __DEV__ && console.log('[withFallbackResult] error:', error)
    return fallbackResult
  }
}

// for better flow control
const catchSync = (func, ...args) => {
  let result, resultError
  try { result = func(...args) } catch (error) { resultError = error || new Error() }
  return { result, error: resultError }
}

const catchAsync = async (func, ...args) => {
  let result, resultError
  try { result = await func(...args) } catch (error) { resultError = error || new Error() }
  return { result, error: resultError }
}
// const catchAsync = (func, ...args) => { // NOTE: reference async-less implementation
//   try {
//     const possiblePromise = func(...args)
//     return catchPromise(possiblePromise)
//   } catch (error) { return Promise.resolve(packError(error)) }
// }

const catchPromise = (promise) => promise.then(packResult, packError)
const packResult = (result) => ({ result, error: undefined })
const packError = (error) => ({ result: undefined, error: error || new Error() })

export {
  remessageError,
  rethrowError,
  withFallbackResult,
  withFallbackResultAsync,
  catchSync,
  catchAsync,
  catchPromise
}
