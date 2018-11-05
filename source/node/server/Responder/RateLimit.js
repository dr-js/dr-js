import { catchAsync } from 'source/common/error'
import { createCacheMap } from 'source/common/data/CacheMap'
import { responderEndWithStatusCode } from './Common'

const DEFAULT_RESPONDER_LIMIT_HIT = (store) => responderEndWithStatusCode(store, { statusCode: 429 })
const DEFAULT_GET_REQUEST_KEY = (store) => `${store.request.socket.remoteAddress}` // limit by ip only
const CACHE_SIZE_SUM_MAX = 32 * 1024 // count
const CACHE_LIMIT_COUNT = 32
const CACHE_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min
const GET_DEFAULT_CACHE_MAP = () => createCacheMap({ valueSizeSumMax: CACHE_SIZE_SUM_MAX, eventHub: null })

const createResponderRateLimit = ({
  responderNext,
  responderLimitHit = DEFAULT_RESPONDER_LIMIT_HIT,
  getRequestKey = DEFAULT_GET_REQUEST_KEY,
  limitCount = CACHE_LIMIT_COUNT,
  expireTime = CACHE_EXPIRE_TIME,
  rateCacheMap = GET_DEFAULT_CACHE_MAP()
}) => (store) => {
  const cacheKey = getRequestKey(store)
  const rateData = rateCacheMap.get(cacheKey) || { cacheKey, limitCount }
  if (rateData.limitCount <= 0) return responderLimitHit(store)
  rateCacheMap.set(cacheKey, { ...rateData, limitCount: rateData.limitCount - 1 }, 1, Date.now() + expireTime)
  return responderNext(store)
}

const createResponderCheckRateLimit = ({ // only record rate limit for failed check
  checkFunc,
  responderNext,
  responderCheckFail,
  responderLimitHit = DEFAULT_RESPONDER_LIMIT_HIT,
  getRequestKey = DEFAULT_GET_REQUEST_KEY,
  limitCount = CACHE_LIMIT_COUNT,
  expireTime = CACHE_EXPIRE_TIME,
  rateCacheMap = GET_DEFAULT_CACHE_MAP()
}) => async (store) => {
  const cacheKey = getRequestKey(store)
  const rateData = rateCacheMap.get(cacheKey) || { cacheKey, limitCount }
  if (rateData.limitCount <= 0) return responderLimitHit(store)
  if ((await catchAsync(checkFunc, store)).result) return responderNext(store)
  rateCacheMap.set(cacheKey, { ...rateData, limitCount: rateData.limitCount - 1 }, 1, Date.now() + expireTime)
  return responderCheckFail(store)
}

export {
  createResponderRateLimit,
  createResponderCheckRateLimit
}
