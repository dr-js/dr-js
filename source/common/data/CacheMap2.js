// Time aware Least Recently Used (TLRU)
// with much simpler code
const createCacheMap2 = ({
  sizeMax,
  expireAfter = 60 * 1000, // in msec, 1min
  map = new Map()
}) => {
  if (__DEV__ && sizeMax <= 0) throw new Error(`invalid sizeMax: ${sizeMax}`)

  return {
    clear: () => map.clear(),
    getSize: () => map.size,
    set: (key, value, expireAt = Date.now() + expireAfter) => {
      map.delete(key) // drop prev cache
      while (map.size >= sizeMax) map.delete(map.keys().next().value)
      map.set(key, { value, expireAt })
    },
    get: (key, time = Date.now()) => {
      const cache = map.get(key)
      if (!cache) return // miss
      map.delete(key) // first drop
      if (cache.expireAt <= time) return // expired
      map.set(key, cache) // promote & return value
      return cache.value
    },
    touch: (key, expireAt = Date.now() + expireAfter) => {
      const cache = map.get(key)
      if (!cache) return
      cache.expireAt = expireAt
      map.delete(key) // first drop
      map.set(key, cache) // promote & return value
      return cache.value
    },
    delete: (key) => {
      const cache = map.get(key)
      if (!cache) return
      map.delete(cache)
      return cache.value
    }
  }
}

export {
  createCacheMap2
}
