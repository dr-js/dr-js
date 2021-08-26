const remessageError = (error, nextMessage) => {
  error.stack && error.stack.replace(error.message, nextMessage) // NOTE: V8(Chrome/Nodejs) will save a copy of message in the `.stack` for simpler `.toString()`, but FireFox will compose correctly
  error.message = nextMessage
  return error
}

const rethrowError = (error) => {
  console.warn(error)
  throw error
}

/** @deprecated */ const tryCall = (thisArg, name, ...args) => { // TODO: DEPRECATE
  try {
    return thisArg[ name ](...args)
  } catch (error) { __DEV__ && console.log('[tryCall] failed:', name, error) }
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
  tryCall, // TODO: DEPRECATE
  catchSync,
  catchAsync,
  catchPromise
}
