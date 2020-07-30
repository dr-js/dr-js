const createMapMap = () => {
  const map = new Map()

  return {
    clear: () => { map.clear() },
    delete: (key0, key1) => {
      const subMap = map.get(key0)
      if (!subMap || !subMap.delete(key1)) return false // no value
      subMap.size === 0 && map.delete(key0)
      return true // value deleted
    },
    set: (key0, key1, value) => {
      let subMap = map.get(key0)
      if (subMap === undefined) map.set(key0, (subMap = new Map()))
      subMap.set(key1, value)
    },
    get: (key0, key1) => {
      const subMap = map.get(key0)
      return subMap && subMap.get(key1)
    },
    getSet: (key0, key1, createValue) => { // TODO: or use the name `getOrCreate`, or `obtain`?
      let subMap = map.get(key0)
      if (subMap === undefined) map.set(key0, (subMap = new Map()))
      let value = subMap.get(key1)
      if (value === undefined) subMap.set(key1, (value = createValue()))
      return value
    },
    has: (key0, key1) => {
      const subMap = map.get(key0)
      return subMap ? subMap.has(key1) : false
    },
    forEach: (callback) => { map.forEach((subMap, key0) => subMap.forEach((value, key1) => callback(value, key1, key0))) },
    forEachSubMap: (callback) => { map.forEach(callback) }, // subMap, key0
    forEachOfSubMap: (key0, callback) => {
      const subMap = map.get(key0)
      subMap && subMap.forEach(callback) // value, key1, subMap
    }
  }
}

const getInvertMapMap = (sourceMapMap, targetMapMap = createMapMap()) => { // NOTE: may loss some value with same key1
  sourceMapMap.forEach((value, key1, key0) => targetMapMap.add(key1, key0, value))
  return targetMapMap
}

export {
  createMapMap,
  getInvertMapMap
}
