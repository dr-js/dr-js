// attach more data to error
const throwInfo = (info, message = info.type) => {
  const error = new Error(message)
  error.info = info
  throw error
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
  throwInfo,
  catchSync,
  catchAsync
}
