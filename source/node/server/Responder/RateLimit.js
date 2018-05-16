import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data/CacheMap'
import { responderEndWithStatusCode } from './Common'

const DEFAULT_RESPONDER_LIMIT_HIT = (store) => responderEndWithStatusCode(store, { statusCode: 429 })
const DEFAULT_GET_REQUEST_KEY = (store) => `${store.request.socket.remoteAddress}` // limit by ip only
const CACHE_SIZE_SUM_MAX = 32 * 1024 // count
const CACHE_LIMIT_COUNT = 32
const CACHE_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 2min
const GET_DEFAULT_CACHE_MAP = () => new CacheMap({
  valueSizeSumMax: CACHE_SIZE_SUM_MAX,
  onCacheAdd: __DEV__ ? (cache) => console.log('[onCacheAdd]', cache.key) : null,
  onCacheDelete: __DEV__ ? (cache) => console.log('[onCacheDelete]', cache.key) : null
})

const createResponderRateLimit = ({
  responderLimitPass,
  responderLimitHit = DEFAULT_RESPONDER_LIMIT_HIT,
  getRequestKey = DEFAULT_GET_REQUEST_KEY,
  limitCount = CACHE_LIMIT_COUNT,
  expireTime = CACHE_EXPIRE_TIME,
  rateCacheMap = GET_DEFAULT_CACHE_MAP()
}) => (store) => {
  const cacheKey = getRequestKey(store)
  const rateData = rateCacheMap.get(cacheKey) || { cacheKey, limitCount }
  if (rateData.limitCount <= 0) return responderLimitHit(store)
  rateCacheMap.set(cacheKey, { ...rateData, limitCount: rateData.limitCount - 1 }, 1, clock() + expireTime)
  return responderLimitPass(store)
}

export { createResponderRateLimit }
