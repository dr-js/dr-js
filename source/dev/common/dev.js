import { clock } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { isCompactArrayShallowEqual } from 'source/common/immutable/check.js'

// memorize expensive immutable transform, with info output, mostly for debug // TODO: remove or reduce code size?
const createTransformCacheWithInfo = (outputInfo = DEFAULT_OUTPUT_INFO, shouldOutputInfo = DEFAULT_SHOULD_OUTPUT_INFO) => {
  const infoArray = []

  const checkInfo = (info) => {
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
      stackInfo: new Error().stack.split('\n')[ 2 ].trim(), // one line
      sumHitCount: 0,
      sumMissCount: 0,
      hitCount: 0,
      missCount: 0
    }
    infoArray.push(info, infoArray)

    return (...args) => { // drop context for immutable transform should not need <this>
      if (!cacheArgs || !isCompactArrayShallowEqual(cacheArgs, args)) {
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
    `[DEBUG][transformCache] ${isBadCache ? 'bad' : 'good'} cache with` +
    ` HIT[${info.hitCount}/${info.hitCount + info.missCount}]` +
    ` SUM[${info.sumHitCount}/${info.sumHitCount + info.sumMissCount}]` +
    `\n[${info.id} of ${infoArray.length}] ${info.stackInfo}`
  )
}

const hijackSetTimeoutInterval = () => {
  const hijackPool = new Map()

  const setTimeoutOrg = setTimeout
  const clearTimeoutOrg = clearTimeout
  const setIntervalOrg = setInterval
  const clearIntervalOrg = clearInterval

  globalThis.setTimeout = (func, delay, ...args) => {
    const token = setTimeoutOrg((...args) => {
      hijackPool.delete(token)
      return func(...args)
    }, delay, ...args)
    hijackPool.set(token, {
      type: 'setTimeout',
      stackList: new Error().stack.split('\n').slice(2),
      startTime: clock(),
      delay
    })
    return token
  }
  globalThis.clearTimeout = (token) => {
    hijackPool.delete(token)
    clearTimeoutOrg(token)
  }

  globalThis.setInterval = (func, delay, ...args) => {
    const token = setIntervalOrg(func, delay, ...args)
    hijackPool.set(token, {
      type: 'setInterval',
      stackList: new Error().stack.split('\n').slice(2),
      startTime: clock(),
      delay
    })
    return token
  }
  globalThis.clearInterval = (token) => {
    hijackPool.delete(token)
    clearIntervalOrg(token)
  }

  const logHijackPool = () => {
    const currentTime = clock()
    const stackList = [ ...hijackPool.values() ]
      .map(({ type, stackList, startTime, delay }) => [ `  [${type}] delay: ${time(delay)}, left: ${time(currentTime - startTime)}`, ...stackList ].join('\n'))
    console.log([ '[devSetTimeoutHijack|logHijackPool]', ...stackList ].join('\n'))
  }

  return {
    hijackPool,
    logHijackPool
  }
}

export {
  createTransformCacheWithInfo,
  hijackSetTimeoutInterval
}
