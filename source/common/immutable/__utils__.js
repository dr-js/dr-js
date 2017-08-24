// only good for full array (no holes) like arguments
const shallowEqualArguments = (prev, next) => {
  if (!prev || prev.length !== next.length) return false
  for (let i = 0, length = prev.length; i < length; i++) if (prev[ i ] !== next[ i ]) return false
  return true
}

// memorize expensive immutable transform
const immutableTransformCache = (transformFunc) => {
  let cacheResult = null
  let cacheArgs = null
  return (...args) => { // drop context for immutable transform should not need <this>
    if (!shallowEqualArguments(cacheArgs, args)) {
      cacheResult = transformFunc.apply(null, args)
      cacheArgs = args
    }
    return cacheResult
  }
}

// memorize expensive immutable transform, with info output, mostly for debug
const createImmutableTransformCacheWithInfo = (outputInfo = DEFAULT_OUTPUT_INFO, shouldOutputInfo = DEFAULT_SHOULD_OUTPUT_INFO) => {
  const infoArray = []

  const checkInfo = (info, infoArray) => {
    if (!shouldOutputInfo(info, infoArray)) return
    outputInfo(info, infoArray)
    info.sumHitCount += info.hitCount
    info.sumMissCount += info.missCount
    info.hitCount = 0
    info.missCount = 0
  }

  return (transformFunc) => {
    let cacheResult = null
    let cacheArgs = null

    // record debug info
    const info = {
      id: `#${infoArray.length}`,
      stackInfo: (new Error('GET STACK')).stack.toString().split('\n')[ 2 ].trim(), // one line
      sumHitCount: 0,
      sumMissCount: 0,
      hitCount: 0,
      missCount: 0
    }
    infoArray.push(info, infoArray)

    return (...args) => { // drop context for immutable transform should not need <this>
      if (!shallowEqualArguments(cacheArgs, args)) {
        cacheResult = transformFunc.apply(null, args)
        cacheArgs = args
        info.missCount++
      } else info.hitCount++

      // check for output
      checkInfo(info)

      return cacheResult
    }
  }
}
const DEFAULT_SHOULD_OUTPUT_INFO = (info, infoArray) => (
  (info.hitCount + info.missCount >= 10 && info.hitCount <= info.missCount) ||
  (info.hitCount + info.missCount >= Math.max(info.sumHitCount, info.sumMissCount, 200))
)
const DEFAULT_OUTPUT_INFO = (info, infoArray) => {
  const isBadCache = info.hitCount <= info.missCount && info.sumHitCount <= info.sumMissCount
  console[ isBadCache ? 'warn' : 'log' ](
    `[DEBUG][immutableTransformCache] ${isBadCache ? 'bad' : 'good'} cache with` +
    ` HIT[${info.hitCount}/${info.hitCount + info.missCount}]` +
    ` SUM[${info.sumHitCount}/${info.sumHitCount + info.sumMissCount}]` +
    `\n[${info.id} of ${infoArray.length}] ${info.stackInfo}`
  )
}

export {
  immutableTransformCache,
  createImmutableTransformCacheWithInfo
}
