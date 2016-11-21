// only good for full array (no holes) like arguments
function shallowEqualArguments (prevArguments, nextArguments) {
  if (!prevArguments || prevArguments.length !== nextArguments.length) return false
  for (let i = 0, length = prevArguments.length; i < length; i++) if (prevArguments[ i ] !== nextArguments[ i ]) return false
  return true
}
// memorize expensive immutable transform
function immutableTransformCache (transformFunc) {
  let cacheResult
  let cacheArguments
  return function () { // drop context for immutable transform should not need <this>
    if (!shallowEqualArguments(cacheArguments, arguments)) {
      cacheResult = transformFunc.apply(null, arguments)
      cacheArguments = arguments
    }
    return cacheResult
  }
}

export {
  immutableTransformCache
}
