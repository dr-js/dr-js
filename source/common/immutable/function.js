import { isCompactArrayShallowEqual } from './check.js'

// memorize expensive immutable transform
const transformCache = (transformFunc) => {
  let cacheResult = null
  let cacheArgs = null
  return (...args) => { // drop context for immutable transform should not need <this>
    if (!cacheArgs || !isCompactArrayShallowEqual(cacheArgs, args)) {
      cacheResult = transformFunc.apply(null, args)
      cacheArgs = args
    }
    return cacheResult
  }
}

export { transformCache }
