import { clock } from 'source/common/time'
import { createHub } from 'source/common/module/Event'
import { DoublyLinkedList } from './LinkedList'

const DEFAULT_EXPIRE_TIME = 60 * 1000 // in msec, 1min

const createCache = (key, value, size, expireAt) => ({ ...DoublyLinkedList.createNode(value), key, size, expireAt })

// TODO: add pack & load as JSON
// Time aware Least Recently Used (TLRU)
const createCacheMap = ({
  valueSizeSumMax,
  valueSizeSingleMax = Math.max(valueSizeSumMax * 0.05, 1)
}) => {
  if (__DEV__ && valueSizeSumMax <= 0) throw new Error(`[CacheMap] invalid valueSizeSumMax: ${valueSizeSumMax}`)

  const { clear: clearHub, subscribe, unsubscribe, send } = createHub()
  const cacheMap = new Map()
  const cacheLinkedList = new DoublyLinkedList()
  let valueSizeSum = 0

  const cacheAdd = (cache) => {
    cacheMap.set(cache.key, cache)
    cacheLinkedList.unshift(cache)
    valueSizeSum += cache.size
    send({ type: 'add', key: cache.key, payload: cache.value })
  }
  const cacheDelete = (cache) => {
    cacheMap.delete(cache.key)
    cacheLinkedList.remove(cache)
    valueSizeSum -= cache.size
    send({ type: 'delete', key: cache.key, payload: cache.value })
  }

  return {
    clearHub,
    subscribe,
    unsubscribe,
    getSize: () => cacheMap.size,
    clear: () => cacheMap.forEach(cacheDelete), // TODO: NOTE: not clearHub
    set: (key, value, size = 1, expireAt = clock() + DEFAULT_EXPIRE_TIME) => {
      const prevCache = cacheMap.get(key)
      prevCache && cacheDelete(prevCache) // drop prev cache
      if (size > valueSizeSingleMax) return // cache busted
      while (size + valueSizeSum > valueSizeSumMax) cacheDelete(cacheLinkedList.tail.prev) // eslint-disable-line no-unmodified-loop-condition
      cacheAdd(createCache(key, value, size, expireAt))
    },
    get: (key, time = clock()) => {
      const cache = cacheMap.get(key)
      if (!cache) return // miss
      __DEV__ && cache.expireAt <= time && console.log('expired', cache.expireAt, time)
      if (cache.expireAt <= time) return cacheDelete(cache) // expire
      cacheLinkedList.setFirst(cache) // promote
      return cache.value
    },
    touch: (key, expireAt = clock() + DEFAULT_EXPIRE_TIME) => {
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
      cacheLinkedList.forEachReverse(({ key, value, size, expireAt }) => dataList.push({ key, value, size, expireAt }))
      return dataList
    },
    parseList: (dataList, time = clock()) => dataList.forEach(({ key, value, size, expireAt }) => {
      const cache = createCache(key, value, size, expireAt)
      if (cache.expireAt <= time) cacheDelete(cache) // expire
      else cacheAdd(cache)
    })
  }
}

class CacheMap { // TODO: DEPRECATED
  constructor (option) {
    Object.assign(this, createCacheMap(option))
    if (option.onCacheAdd) this.subscribe(({ type, key, payload }) => type === 'add' && option.onCacheAdd({ key, value: payload }))
    if (option.onCacheDelete) this.subscribe(({ type, key, payload }) => type === 'delete' && option.onCacheDelete({ key, value: payload }))
  }

  get size () { return this.getSize() }
}

export {
  createCacheMap,
  CacheMap // TODO: DEPRECATED
}
