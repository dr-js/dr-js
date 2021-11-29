import { createHub } from 'source/common/module/Event.js'
/** @typedef { import("../module/Event.js").EventHub } EventHub */
/** @typedef { import("../module/Event.js").EventHubListenerFunc } EventHubListenerFunc */
import { createDoublyLinkedList, createNode } from './LinkedList.js'
/** @typedef { import("./LinkedList.js").LinkedListNode } LinkedListNode */

const DEFAULT_EXPIRE_TIME = 60 * 1000 // in msec, 1min

/** @typedef { { key: vJSON, size: number, expireAt: number } & LinkedListNode } CacheMapCache */
/** @type { (key: vJSON, value: vJSON, size: number, expireAt: number) => CacheMapCache } */
const createCache = (key, value, size, expireAt) => ({
  ...createNode(value), // value, prev, next
  key,
  size,
  expireAt
})

// Time aware Least Recently Used (TLRU)
/** @typedef { (key: vJSON, value: vJSON, size: number, expireAt: number) => void } SetCacheMap */
/** @typedef { (key: vJSON, time: number) => vJSON | void } GetCacheMap */
/** @typedef { (key: vJSON) => vJSON } DeleteCacheMap */
/** @typedef { { value: vJSON, key: vJSON, size: number, expireAt: number } } CacheMapCacheSave */
/** @typedef { {
 * hasEventHub: boolean, clearEventHub: GetVoid, subscribe: EventHubListenerFunc, unsubscribe: EventHubListenerFunc,
 * clear: GetVoid,
 * getSize: GetNumber, getValueSizeSum: GetNumber,
 * set: SetCacheMap, get: GetCacheMap, touch: GetCacheMap, delete: DeleteCacheMap,
 * saveCacheList: () => CacheMapCacheSave[], loadCacheList: (v: CacheMapCacheSave[], t?: number) => void,
 * } } CacheMap */
/** @type { (option: {
 *   valueSizeSumMax: number,
 *   valueSizeSingleMax?: number,
 *   eventHub?: EventHub | null
 * }) => CacheMap } */
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
  } = /** @type { ?EventHub } */ (hasEventHub ? eventHub : {})

  /** @type { Map<vJSON, CacheMapCache> } */
  const map = new Map()
  const linkedList = createDoublyLinkedList()
  let valueSizeSum = 0

  /** @type { (CacheMapCache) => void } */
  const cacheAdd = (cache) => {
    map.set(cache.key, cache)
    linkedList.unshift(cache)
    valueSizeSum += cache.size
    hasEventHub && send({ type: 'add', key: cache.key, payload: cache.value })
  }
  /** @type { (CacheMapCache) => void } */
  const cacheDelete = (cache) => {
    map.delete(cache.key)
    linkedList.remove(cache)
    valueSizeSum -= cache.size
    hasEventHub && send({ type: 'delete', key: cache.key, payload: cache.value })
  }

  /** @type { CacheMap } */
  return {
    hasEventHub,
    clearEventHub,
    subscribe,
    unsubscribe,
    clear: () => map.forEach(cacheDelete), // use cacheDelete for event send // NOTE: not clearEventHub, so listener will remain // TODO: change to clearMap since this do not clear ALL state?
    getSize: linkedList.getLength,
    getValueSizeSum: () => valueSizeSum,
    /** @type { SetCacheMap } */
    set: (key, value, size = 1, expireAt = Date.now() + DEFAULT_EXPIRE_TIME) => {
      const prevCache = map.get(key)
      prevCache && cacheDelete(prevCache) // drop prev cache
      if (size > valueSizeSingleMax) return // size too big for cache
      while (size + valueSizeSum > valueSizeSumMax) cacheDelete(linkedList.getTail().prev) // eslint-disable-line no-unmodified-loop-condition
      cacheAdd(createCache(key, value, size, expireAt))
    },
    /** @type { GetCacheMap } */
    get: (key, time = Date.now()) => {
      const cache = map.get(key)
      if (!cache) return // miss
      __DEV__ && cache.expireAt <= time && console.log('expired', cache.expireAt, time)
      if (cache.expireAt <= time) return cacheDelete(cache) // expire
      linkedList.moveToFirst(cache) // promote
      return cache.value
    },
    /** @type { GetCacheMap } */
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
      /** @type { CacheMapCacheSave[] } */
      const cacheList = []
      linkedList.forEachReverse((/** @type { CacheMapCache } */ node) => {
        const { key, value, size, expireAt } = node
        cacheList.push({ key, value, size, expireAt })
      }) // output with older cache first for simpler load & filter data
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
