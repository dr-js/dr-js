const rethrowError = (error) => {
  console.warn(error)
  throw error
}

const throwInfo = (info, message = info.type) => { // attach more data to error // TODO: deprecate if not actually using
  const error = new Error(message)
  error.info = info
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
  try { result = func(...args) } catch (error) { resultError = error }
  return { result, error: resultError }
}

const catchAsync = async (func, ...args) => {
  let result, resultError
  try { result = await func(...args) } catch (error) { resultError = error }
  return { result, error: resultError }
}

export {
  rethrowError,
  throwInfo,
  tryCall,
  catchSync,
  catchAsync
}
