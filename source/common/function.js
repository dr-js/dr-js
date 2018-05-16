import { clock, setTimeoutAsync } from 'source/common/time'
import { rethrowError } from 'source/common/error'

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

// drop calls during async function running, good to make a trigger for async func
// WARN: lossyFunc will drop return result from func
const lossyAsync = (func, onError = rethrowError) => {
  let runningPromise
  const onResolve = () => { runningPromise = undefined }
  const onReject = (error) => {
    runningPromise = undefined
    onError(error)
  }
  return {
    trigger: (...args) => {
      if (runningPromise) return
      try {
        const result = func.apply(null, args)
        if (result instanceof Object && result.then) runningPromise = result.then(onResolve, onReject)
        else onResolve()
      } catch (error) { onReject(error) }
    },
    getRunningPromise: () => runningPromise
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

// if maxRetry is always 0, should just skip this wrap
const withRetryAsync = async (func, maxRetry = Infinity, wait = 0) => {
  let failed = 0
  while (true) {
    const startTime = clock()
    try { return await func(failed, maxRetry) } catch (error) { // NOTE: this is not the same as `try { return func(failed, maxRetry) } catch (error) {`
      failed++
      if (maxRetry < failed) throw error
      const remainingTime = wait - (clock() - startTime)
      if (remainingTime > 0) await setTimeoutAsync(remainingTime)
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
      const resolve = promiseResolve
      promiseResolve = promiseReject = undefined
      resolve && resolve(value)
    },
    reject: (error) => {
      const reject = promiseReject
      promiseResolve = promiseReject = undefined
      reject && reject(error)
    }
  }
}

// for dynamic appending tasks, use `Common.Module.createAsyncTaskQueue`
const promiseQueue = async ({ asyncTaskList, shouldContinueOnError = false }) => { // TODO: DEPRECATED
  const resultList = []
  const errorList = []
  const endList = []
  const pendingList = [ ...asyncTaskList ] // do not change original asyncTaskList
  while (pendingList.length) {
    const index = endList.length
    const asyncTask = pendingList.shift()
    endList.push(asyncTask) // this asyncTask will end either way
    try { resultList[ index ] = await asyncTask() } catch (error) {
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

export {
  debounce,
  throttle,
  lossyAsync,
  withDelayArgvQueue,
  withRepeat,
  withRetryAsync,
  createInsideOutPromise,
  promiseQueue // TODO: DEPRECATED
}
