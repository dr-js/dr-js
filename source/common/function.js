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

// inactive for `wait` time
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

// control flow
const repeat = (count, func) => {
  let looped = 0
  while (count > looped) {
    func(looped, count)
    looped++
  }
}

const promiseQueue = async ({ taskList, shouldContinueOnError = false }) => {
  const resultList = []
  const errorList = []
  const endList = []
  const pendingList = [ ...taskList ]
  while (pendingList.length) {
    const index = endList.length
    const task = pendingList.shift()
    endList.push(task)
    try {
      resultList[ index ] = await task()
    } catch (error) {
      errorList[ index ] = error
      if (!shouldContinueOnError) break
    }
  }
  return { resultList, errorList, endList, pendingList }
}

export {
  debounce,
  throttle,
  repeat,
  promiseQueue
}
