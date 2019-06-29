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
    clear: clearHub,
    subscribe,
    unsubscribe,
    send
  } = hasEventHub ? eventHub : {}

  const cacheMap = new Map()
  const cacheLinkedList = createDoublyLinkedList()
  let valueSizeSum = 0

  const cacheAdd = (cache) => {
    cacheMap.set(cache.key, cache)
    cacheLinkedList.unshift(cache)
    valueSizeSum += cache.size
    hasEventHub && send({ type: 'add', key: cache.key, payload: cache.value })
  }
  const cacheDelete = (cache) => {
    cacheMap.delete(cache.key)
    cacheLinkedList.remove(cache)
    valueSizeSum -= cache.size
    hasEventHub && send({ type: 'delete', key: cache.key, payload: cache.value })
  }

  return {
    hasEventHub,
    clearHub,
    subscribe,
    unsubscribe,
    clear: () => cacheMap.forEach(cacheDelete), // TODO: NOTE: not calling clearHub, so listener is kept
    getSize: () => cacheMap.size,
    getValueSize: () => valueSizeSum,
    set: (key, value, size = 1, expireAt = Date.now() + DEFAULT_EXPIRE_TIME) => {
      const prevCache = cacheMap.get(key)
      prevCache && cacheDelete(prevCache) // drop prev cache
      if (size > valueSizeSingleMax) return // cache busted
      while (size + valueSizeSum > valueSizeSumMax) cacheDelete(cacheLinkedList.getTail().prev) // eslint-disable-line no-unmodified-loop-condition
      cacheAdd(createCache(key, value, size, expireAt))
    },
    get: (key, time = Date.now()) => {
      const cache = cacheMap.get(key)
      if (!cache) return // miss
      __DEV__ && cache.expireAt <= time && console.log('expired', cache.expireAt, time)
      if (cache.expireAt <= time) return cacheDelete(cache) // expire
      cacheLinkedList.setFirst(cache) // promote
      return cache.value
    },
    touch: (key, expireAt = Date.now() + DEFAULT_EXPIRE_TIME) => {
      const cache = cacheMap.get(key)
      if (!cache) return
      cache.expireAt = expireAt
      cacheLinkedList.setFirst(cache) // promote
      return cache.value
    },
    delete: (key) => {
      const cache = cacheMap.get(key)
      cache && cacheDelete(cache)
      return cache && cache.value
    },
    packList: () => {
      const dataList = []
      cacheLinkedList.forEachReverse(({ key, value, size, expireAt }) => dataList.push({ key, value, size, expireAt })) // filter data
      return dataList
    },
    parseList: (dataList, time = Date.now()) => dataList.forEach(({ key, value, size, expireAt }) => {
      const cache = createCache(key, value, size, expireAt)
      if (cache.expireAt <= time) cacheDelete(cache) // expire
      else cacheAdd(cache)
    })
  }
}

export {
  createCache,
  createCacheMap
}
