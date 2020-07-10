import { createHub } from 'source/common/module/Event'
import { createDoublyLinkedList, createNode } from './LinkedList'

const DEFAULT_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createCache = (key, value, size, expireAt) => ({
  ...createNode(value), // value, prev, next
  key,
  size,
  expireAt
})

// Time aware Least Recently Used (TLRU)
const createCacheMap = ({
  valueSizeSumMax,
  valueSizeSingleMax = Math.max(valueSizeSumMax * 0.05, 1), // limit big value for cache efficiently
  eventHub = createHub() // set to null should be faster, if no event is needed
}) => {
  if (__DEV__ && valueSizeSumMax <= 0) throw new Error(`invalid valueSizeSumMax: ${valueSizeSumMax}`)

  const hasEventHub = Boolean(eventHub)
  const {
    clear: clearEventHub,
    subscribe,
    unsubscribe,
    send
  } = hasEventHub ? eventHub : {}

  const map = new Map()
  const linkedList = createDoublyLinkedList()
  let valueSizeSum = 0

  const cacheAdd = (cache) => {
    map.set(cache.key, cache)
    linkedList.unshift(cache)
    valueSizeSum += cache.size
    hasEventHub && send({ type: 'add', key: cache.key, payload: cache.value })
  }
  const cacheDelete = (cache) => {
    map.delete(cache.key)
    linkedList.remove(cache)
    valueSizeSum -= cache.size
    hasEventHub && send({ type: 'delete', key: cache.key, payload: cache.value })
  }

  return {
    hasEventHub,
    clearEventHub,
    subscribe,
    unsubscribe,
    clear: () => map.forEach(cacheDelete), // use cacheDelete for event send // NOTE: not clearEventHub, so listener will remain // TODO: change to clearMap since this do not clear ALL state?
    getSize: linkedList.getLength,
    getValueSizeSum: () => valueSizeSum,
    set: (key, value, size = 1, expireAt = Date.now() + DEFAULT_EXPIRE_TIME) => {
      const prevCache = map.get(key)
      prevCache && cacheDelete(prevCache) // drop prev cache
      if (size > valueSizeSingleMax) return // size too big for cache
      while (size + valueSizeSum > valueSizeSumMax) cacheDelete(linkedList.getTail().prev) // eslint-disable-line no-unmodified-loop-condition
      cacheAdd(createCache(key, value, size, expireAt))
    },
    get: (key, time = Date.now()) => {
      const cache = map.get(key)
      if (!cache) return // miss
      __DEV__ && cache.expireAt <= time && console.log('expired', cache.expireAt, time)
      if (cache.expireAt <= time) return cacheDelete(cache) // expire
      linkedList.moveToFirst(cache) // promote
      return cache.value
    },
    touch: (key, expireAt = Date.now() + DEFAULT_EXPIRE_TIME) => {
      const cache = map.get(key)
      if (!cache) return
      cache.expireAt = expireAt
      linkedList.moveToFirst(cache) // promote
      return cache.value
    },
    delete: (key) => {
      const cache = map.get(key)
      cache && cacheDelete(cache)
      return cache && cache.value
    },
    saveCacheList: () => {
      const cacheList = []
      linkedList.forEachReverse(({ key, value, size, expireAt }) => cacheList.push({ key, value, size, expireAt })) // output with older cache first for simpler load & filter data
      return cacheList
    },
    loadCacheList: (cacheList, time = Date.now()) => cacheList.forEach(({ key, value, size, expireAt }) => {
      if (expireAt <= time) return // expired, drop
      const cache = map.get(key)
      if (cache && cache.expireAt >= expireAt) return // exist cache is good, skip
      cache && cacheDelete(cache)
      cacheAdd(createCache(key, value, size, expireAt))
    })
  }
}

export {
  createCache,
  createCacheMap
}
