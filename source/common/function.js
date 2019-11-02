import { clock, setTimeoutAsync } from 'source/common/time'
import { rethrowError } from 'source/common/error'
import { isPromiseAlike } from 'source/common/check'

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
        if (isPromiseAlike(result)) runningPromise = result.then(onResolve, onReject)
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
const withTimeoutAsync = (func, timeout) => withTimeoutPromise(func(), timeout)

const withTimeoutPromise = (promise, timeout) => {
  let timeoutToken = null
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timeoutToken = setTimeout(
        () => reject(new Error(`timeout after: ${timeout}`)),
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
      throw error
    }
  )
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

export {
  debounce,
  throttle,
  lossyAsync,
  withDelayArgvQueue,
  withRepeat,
  withRepeatAsync,
  withRetry,
  withRetryAsync,
  withTimeoutAsync,
  withTimeoutPromise,
  createInsideOutPromise
}
