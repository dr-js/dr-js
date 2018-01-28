import { clock } from 'source/common/time'
import { DoublyLinkedList } from './LinkedList'

const DEFAULT_VALUE_SIZE_SUM_MAX = 10 * 1024 * 1024 // in byte, 10mB
const DEFAULT_EXPIRE_TIME = 60 * 1000 // in msec, 1min

// Time aware Least Recently Used (TLRU)
class CacheMap {
  constructor (option = {}) {
    const { valueSizeSumMax = DEFAULT_VALUE_SIZE_SUM_MAX, onCacheAdd = null, onCacheDelete = null } = option

    this.cacheMap = new Map()
    this.cacheLinkedList = new DoublyLinkedList()

    this.valueSizeSum = 0
    this.valueSizeSumMax = valueSizeSumMax
    this.valueSizeSingleMax = Math.max(valueSizeSumMax * 0.05, 1)

    this.onCacheAdd = onCacheAdd
    this.onCacheDelete = onCacheDelete
  }

  get size () { return this.cacheMap.size }

  clear () { this.cacheMap.forEach(this.cacheDelete, this) }

  cacheAdd (cache) {
    this.cacheMap.set(cache.key, cache)
    this.cacheLinkedList.unshift(cache)
    this.valueSizeSum += cache.size
    this.onCacheAdd && this.onCacheAdd(cache)
  }

  cacheDelete (cache) {
    this.cacheMap.delete(cache.key)
    this.cacheLinkedList.remove(cache)
    this.valueSizeSum -= cache.size
    this.onCacheDelete && this.onCacheDelete(cache)
  }

  get (key, time = clock()) {
    const cache = this.cacheMap.get(key)
    if (!cache) return // miss
    if (cache.expireAt <= time) { // expire
      __DEV__ && console.log('expired', cache.expireAt, time)
      this.cacheDelete(cache)
      return
    }
    this.cacheLinkedList.setFirst(cache) // promote
    return cache.value
  }

  set (key, value, size = 1, expireAt = clock() + DEFAULT_EXPIRE_TIME) {
    if (__DEV__ && !key) throw new Error('[CacheMap][set] invalid key')
    if (__DEV__ && !size) throw new Error('[CacheMap][set] invalid size')
    let cache = this.cacheMap.get(key)
    if (cache) this.cacheDelete(cache) // check remove
    if (size > this.valueSizeSingleMax) return // cache busted
    while (this.valueSizeSum && size + this.valueSizeSum > this.valueSizeSumMax) this.cacheDelete(this.cacheLinkedList.tail.prev) // compress cache
    if (cache) cache.value = value
    else {
      cache = DoublyLinkedList.createNode(value)
      cache.key = key
    }
    cache.size = size
    cache.expireAt = expireAt
    this.cacheAdd(cache)
  }
}

export { CacheMap }
