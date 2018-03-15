// https://davidwalsh.name/javascript-debounce-function
// https://gist.github.com/nmsdvid/8807205
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
const debounce = (func, wait = 250, isLeadingEdge = false) => {
  let timeoutToken = null
  return (...args) => {
    const isCallNow = isLeadingEdge && (timeoutToken === null)
    clearTimeout(timeoutToken)
    timeoutToken = setTimeout(() => {
      timeoutToken = null
      !isLeadingEdge && func.apply(null, args)
    }, wait)
    isCallNow && func.apply(null, args)
  }
}

// inactive for `wait` time, will drop arguments during inactive time
const throttle = (func, wait = 250, isLeadingEdge = false) => {
  let timeoutToken = null
  return (...args) => {
    if (timeoutToken) return // inactive
    const isCallNow = isLeadingEdge && (timeoutToken === null)
    timeoutToken = setTimeout(() => {
      timeoutToken = null
      !isLeadingEdge && func.apply(null, args)
    }, wait)
    isCallNow && func.apply(null, args)
  }
}

const withDelayArgvQueue = (func, delayWrapper = debounce, ...args) => {
  let argvQueue = []
  const delayFunc = delayWrapper(() => {
    const currentArgvQueue = argvQueue
    argvQueue = []
    func(currentArgvQueue)
  }, ...args)
  return (...argv) => {
    argvQueue.push(argv)
    delayFunc()
  }
}

const withRepeat = (func, count = 0) => {
  let looped = 0
  while (count > looped) {
    func(looped, count)
    looped++
  }
}

const withRetryAsync = async (func, maxRetry = Infinity) => {
  let failed = 0
  while (true) {
    try { return func(failed, maxRetry) } catch (error) {
      if (maxRetry > failed) failed++
      else throw error
    }
  }
}

const createInsideOutPromise = () => {
  let promiseResolve, promiseReject
  return {
    promise: new Promise((resolve, reject) => {
      promiseResolve = resolve
      promiseReject = reject
    }),
    resolve: (value) => {
      if (promiseResolve === undefined) return
      const resolve = promiseResolve
      promiseResolve = promiseReject = undefined
      return resolve(value)
    },
    reject: (error) => {
      if (promiseReject === undefined) return
      const reject = promiseReject
      promiseResolve = promiseReject = undefined
      return reject(error)
    }
  }
}

// for dynamic appending tasks, use `Common.Module.createAsyncTaskQueue`
const promiseQueue = async ({ asyncTaskList, shouldContinueOnError = false }) => {
  const resultList = []
  const errorList = []
  const endList = []
  const pendingList = [ ...asyncTaskList ] // do not change original asyncTaskList
  while (pendingList.length) {
    const index = endList.length
    const asyncTask = pendingList.shift()
    endList.push(asyncTask) // this asyncTask will end either way
    try {
      resultList[ index ] = await asyncTask()
    } catch (error) {
      errorList[ index ] = error
      if (!shouldContinueOnError) break
    }
  }
  return {
    resultList,
    errorList,
    endList,
    pendingList // normally empty. If shouldContinueOnError and got error, this list will have some pending asyncTask
  }
}

const createDelayArgvQueue = withDelayArgvQueue // TODO: deprecate
const repeat = (count, func) => { // TODO: deprecate
  let looped = 0
  while (count > looped) {
    func(looped, count)
    looped++
  }
}

export {
  debounce,
  throttle,
  withDelayArgvQueue,
  withRepeat,
  withRetryAsync,
  createInsideOutPromise,
  promiseQueue,

  createDelayArgvQueue, // TODO: deprecate
  repeat // TODO: deprecate
}
