// https:// davidwalsh.name/javascript-debounce-function
// https:// gist.github.com/nmsdvid/8807205
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce (func, wait = 250, isLeadingEdge = false) {
  let timeoutToken = null
  return function () {
    const context = this
    const args = arguments
    const isCallNow = isLeadingEdge && (timeoutToken === null)
    clearTimeout(timeoutToken)
    timeoutToken = setTimeout(function () {
      timeoutToken = null
      !isLeadingEdge && func.apply(context, args)
    }, wait)
    isCallNow && func.apply(context, args)
  }
}

// inactive for `wait` time
function throttle (func, wait = 250, isLeadingEdge = false) {
  let timeoutToken = null
  return function () {
    if (timeoutToken) return // inactive
    const context = this
    const args = arguments
    const isCallNow = isLeadingEdge && (timeoutToken === null)
    timeoutToken = setTimeout(function () {
      timeoutToken = null
      !isLeadingEdge && func.apply(context, args)
    }, wait)
    isCallNow && func.apply(context, args)
  }
}

// control flow
function repeat (count, func) {
  let looped = 0
  while (count > looped) {
    func(looped, count)
    looped++
  }
}

export {
  debounce,
  throttle,
  repeat
}
