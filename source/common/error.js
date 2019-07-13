const rethrowError = (error) => {
  console.warn(error)
  throw error
}

const tryCall = (thisArg, name, ...args) => {
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

// NOTE: reference async-less implementation
// const catchAsync = (func, ...args) => {
//   try {
//     return Promise.resolve(func(...args)).then(packResult, packError)
//   } catch (error) { return Promise.resolve(packError(error)) }
// }
// const packResult = (result) => ({ result, error: undefined })
// const packError = (error) => ({ result: undefined, error: error || new Error() })

export {
  rethrowError,
  tryCall,
  catchSync,
  catchAsync
}
