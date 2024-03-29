import { clock, setWeakTimeout, setTimeoutAsync } from 'source/common/time.js'
import { rethrowError } from 'source/common/error.js'
import { isPromiseAlike } from 'source/common/check.js'

// https://davidwalsh.name/javascript-debounce-function
// https://gist.github.com/nmsdvid/8807205
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `isLeadingEdge` is set, trigger the function on the
// leading edge, instead of the trailing.

// Stay inactive if called within `wait` time, will drop arguments during inactive time
/** @deprecated */ const debounce = (func, wait = 250, isLeadingEdge = false) => (isLeadingEdge ? debounceL : debounceT)(func, wait)
const debounceT = (func, wait = 250) => { // TrailingEdge
  let timeoutToken = null
  return (...args) => {
    clearTimeout(timeoutToken)
    timeoutToken = setTimeout(() => {
      timeoutToken = null
      func.apply(null, args)
    }, wait)
  }
}
const debounceL = (func, wait = 250) => { // LeadingEdge
  let timeoutToken = null
  return (...args) => {
    const isCallNow = timeoutToken === null
    clearTimeout(timeoutToken)
    timeoutToken = setTimeout(() => { timeoutToken = null }, wait)
    isCallNow && func.apply(null, args)
  }
}
// TODO: need `debounceLT`?

// Inactive for `wait` time, will drop arguments during inactive time
/** @deprecated */ const throttle = (func, wait = 250, isLeadingEdge = false) => (isLeadingEdge ? throttleL : throttleTE)(func, wait)
/** @deprecated */ const throttleTE = (func, wait = 250) => { // TrailingEdge, but use first received args
  let timeoutToken = null
  return (...args) => {
    if (timeoutToken) return // inactive
    timeoutToken = setWeakTimeout(() => { // NOTE: use weak version, since the value is dropped either way
      timeoutToken = null
      func.apply(null, args)
    }, wait)
  }
}
const throttleT = (func, wait = 250) => { // TrailingEdge, use last received args
  let timeoutToken = null
  let lastArgs = null
  return (...args) => {
    lastArgs = args
    if (timeoutToken) return // inactive
    timeoutToken = setWeakTimeout(() => { // NOTE: use weak version, since the value is dropped either way
      timeoutToken = null
      func.apply(null, lastArgs)
      lastArgs = null
    }, wait)
  }
}
const throttleL = (func, wait = 250) => { // LeadingEdge
  let timeoutToken = null
  return (...args) => {
    if (timeoutToken) return // inactive
    const isCallNow = timeoutToken === null
    timeoutToken = setWeakTimeout(() => { timeoutToken = null }, wait) // NOTE: use weak version, since the value is dropped either way
    isCallNow && func.apply(null, args)
  }
}
// TODO: need `throttleLT`?

const once = (func) => { // NOTE: also support asyncFunc
  let isCalled = false
  return (...args) => {
    if (isCalled === true) return
    isCalled = true
    return func.apply(null, args)
  }
}

// drop calls during async function running, good to make a trigger for async func
// WARN: lossyFunc will drop return result from func
/** @type { (asyncFunc: Function, onError?: Function) => {
  trigger: Function,
  getRunningPromise: () => Promise | undefined
} } */
const lossyAsync = (asyncFunc, onError = rethrowError) => {
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
        const result = asyncFunc.apply(null, args)
        if (isPromiseAlike(result)) runningPromise = result.then(onResolve, onReject)
        else onResolve()
      } catch (error) { onReject(error) }
    },
    getRunningPromise: () => runningPromise
  }
}

// for warping data-sync or bg-task functions, or simpler `lossyAsync`
const loneAsync = (asyncFunc) => {
  let runningPromise
  const onEnd = () => { runningPromise = undefined }
  return (...args) => {
    if (runningPromise) return runningPromise
    const result = asyncFunc.apply(null, args)
    if (isPromiseAlike(result)) {
      result.then(onEnd, onEnd)
      runningPromise = result
    }
    return result
  }
}

// getter, delay heavy/long init till first use
const withCache = (func) => {
  let cache
  return () => {
    if (cache === undefined) cache = func()
    return cache
  }
}
const withCacheAsync = (asyncFunc) => {
  let cache
  return async () => {
    if (cache === undefined) cache = await asyncFunc()
    return cache
  }
}

/** @deprecated */ const withDelayArgvQueue = (func, delayWrapper = debounce, ...args) => {
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

const withRepeatAsync = async (func, count = 0, wait = 0) => {
  let looped = 0
  while (count > looped) {
    const startTime = clock()
    await func(looped, count)
    looped++
    const remainingTime = wait - (clock() - startTime)
    if (remainingTime > 0) await setTimeoutAsync(remainingTime)
  }
}
// const withRepeatAsync = (func, count = 0, wait = 0) => { // NOTE: reference async-less implementation
//   let looped = 0
//   const loopThen = () => {
//     if (!(count > looped)) return // done
//     const startTime = clock()
//     return Promise.resolve(func(looped, count)).then(() => {
//       looped++
//       const remainingTime = wait - (clock() - startTime)
//       if (remainingTime > 0) return setTimeoutAsync(remainingTime).then(loopThen)
//       return loopThen()
//     })
//   }
//   return Promise.resolve(loopThen())
// }

// if maxRetry is always 0, should just skip this wrap
const withRetry = (func, maxRetry = Infinity) => {
  let failed = 0
  while (true) {
    try { return func(failed, maxRetry) } catch (error) {
      failed++
      if (maxRetry < failed) throw error
    }
  }
}

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
// const withRetryAsync = (func, maxRetry = Infinity, wait = 0) => { // NOTE: reference async-less implementation
//   let failed = 0
//   const promiseFunc = () => {
//     try {
//       return Promise.resolve(func(failed, maxRetry))
//     } catch (error) { return Promise.reject(error) }
//   }
//   const loopThen = () => {
//     const startTime = clock()
//     return promiseFunc().then(onResult, (error) => {
//       failed++
//       if (maxRetry < failed) return Promise.reject(error)
//       const remainingTime = wait - (clock() - startTime)
//       if (remainingTime > 0) return setTimeoutAsync(remainingTime).then(loopThen)
//       return loopThen()
//     })
//   }
//   return loopThen()
// }
// const onResult = (result) => result

// to prevent async hanging (un-resolving promise)
// TODO: this only prevent a promise timeout blocking follow-up code for too long, but the timeout code is not canceled
const withTimeoutAsync = (func, timeout, message = '') => withTimeoutPromise(func(), timeout, message)

const withTimeoutPromise = (
  promise,
  timeout, // in msec, 0 for unlimited
  message = ''
) => {
  if (!(timeout > 0)) return promise // no timeout (unlimited)
  let timeoutToken = null
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timeoutToken = setWeakTimeout( // NOT: use weak version, since the input promise should keep the progress running
        () => reject(DUMMY_ERROR),
        timeout
      )
    })
  ]).then(
    (result) => {
      clearTimeout(timeoutToken)
      return result
    },
    (error) => {
      clearTimeout(timeoutToken)
      // check: https://stackoverflow.com/questions/46528508/how-can-i-see-the-full-stack-trace-of-error-in-settimeout-with-a-promise
      // check: https://github.com/nodejs/help/issues/1904
      throw (error !== DUMMY_ERROR) ? error : new Error(`timeout after: ${timeout}${message ? `, ${message}` : ''}`) // for a better stack trace, and late add prevent stack trace performance issue
    }
  )
}
const DUMMY_ERROR = {}

/** @type { <T>() => { promise: Promise<T>, resolve: (v?: T) => void, reject: (e: Error) => void } } */
const createInsideOutPromise = () => {
  let promiseResolve, promiseReject
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })
  return {
    promise,
    resolve: promiseResolve,
    reject: promiseReject
  }
}

const runAsPromise = (func) => {
  try {
    const result = func()
    if (isPromiseAlike(result)) return result
    return Promise.resolve(result)
  } catch (error) { return Promise.reject(error) }
}

const runAsyncByLane = (
  laneSize,
  asyncFuncList = []
) => {
  laneSize = Math.min(laneSize, asyncFuncList.length)
  if (laneSize === 0) return Promise.resolve()
  const afList = [ ...asyncFuncList ] // dup list
  const iop = createInsideOutPromise()
  let isAbort = false
  let activeTask = 0
  const onResolve = () => {
    if (isAbort) return
    activeTask--
    if (!afList.length && !activeTask) iop.resolve() // all done
    else runMore()
  }
  const onReject = (error) => {
    isAbort = true
    iop.reject(error)
  }
  const runMore = () => {
    if (isAbort) return
    while (activeTask < laneSize && afList.length) {
      activeTask++
      runAsPromise(afList.shift()).then(onResolve, onReject)
    }
  }
  runMore()
  return iop.promise
}

export {
  debounce, debounceT, debounceL,
  throttle, throttleT, throttleL,
  once,
  lossyAsync, loneAsync,
  withCache, withCacheAsync,
  withDelayArgvQueue,
  withRepeat, withRepeatAsync,
  withRetry, withRetryAsync,
  withTimeoutAsync, withTimeoutPromise,
  createInsideOutPromise,
  runAsPromise,
  runAsyncByLane
}
