import { catchAsync } from 'source/common/error.js'
import { createCacheMap } from 'source/common/data/CacheMap.js'
import { responderEndWithStatusCode } from './Common.js'

const DEFAULT_RESPONDER_DENY = (store, limitLeft) => responderEndWithStatusCode(store, { statusCode: limitLeft <= 0 ? 429 : 400 })
const DEFAULT_GET_REQUEST_KEY = (store) => `${store.request.socket.remoteAddress}` // limit by ip only
const CACHE_SIZE_SUM_MAX = 32 * 1024 // count, of cacheKey
const CACHE_LIMIT_COUNT = 32 // allowed fail during the expire time
const CACHE_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min, time to wait until limitLeft is reset
const GET_DEFAULT_CACHE_MAP = () => createCacheMap({ valueSizeSumMax: CACHE_SIZE_SUM_MAX, eventHub: null })

const createResponderRateLimit = ({ // rate limit for all request, must wait expireTime to reset limitLeft
  responderNext,
  responderDeny = DEFAULT_RESPONDER_DENY,
  getRequestKey = DEFAULT_GET_REQUEST_KEY,
  limitCount = CACHE_LIMIT_COUNT,
  expireTime = CACHE_EXPIRE_TIME,
  rateCacheMap = GET_DEFAULT_CACHE_MAP()
}) => (store) => {
  const cacheKey = getRequestKey(store)
  let limitLeft = rateCacheMap.get(cacheKey)
  if (limitLeft === undefined) limitLeft = limitCount
  if (limitLeft <= 0) return responderDeny(store, limitLeft)

  rateCacheMap.set(cacheKey, limitLeft - 1, 1, Date.now() + expireTime)
  return responderNext(store, limitLeft)
}

const createResponderCheckRateLimit = ({ // only record rate limit for failed check
  checkFunc, // return true to pass check
  responderNext,
  responderDeny = DEFAULT_RESPONDER_DENY,
  getRequestKey = DEFAULT_GET_REQUEST_KEY,
  limitCount = CACHE_LIMIT_COUNT,
  expireTime = CACHE_EXPIRE_TIME,
  rateCacheMap = GET_DEFAULT_CACHE_MAP()
}) => async (store) => {
  const cacheKey = getRequestKey(store)
  let limitLeft = rateCacheMap.get(cacheKey)
  if (limitLeft === undefined) limitLeft = limitCount
  if (limitLeft <= 0) return responderDeny(store, limitLeft)

  const { error, result: isCheckPass } = await catchAsync(checkFunc, store, limitLeft)
  if (isCheckPass) return responderNext(store, limitLeft)

  rateCacheMap.set(cacheKey, limitLeft - 1, 1, Date.now() + expireTime)
  return responderDeny(store, limitLeft, error)
}

export {
  createResponderRateLimit,
  createResponderCheckRateLimit
}
