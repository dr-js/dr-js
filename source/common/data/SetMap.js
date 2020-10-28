const createSetMap = () => {
  const map = new Map()

  return {
    clear: () => { map.clear() },
    delete: (mapKey, setKey) => {
      const set = map.get(mapKey)
      if (!set || !set.delete(setKey)) return false
      set.size === 0 && map.delete(mapKey)
      return true
    },
    add: (mapKey, setKey) => {
      let set = map.get(mapKey)
      if (set === undefined) map.set(mapKey, (set = new Set()))
      set.add(setKey)
    },
    get: (mapKey, setKey) => {
      const set = map.get(mapKey)
      return set && set.get(setKey)
    },
    has: (mapKey, setKey) => {
      const set = map.get(mapKey)
      return set ? set.has(setKey) : false
    },
    forEach: (callback) => { map.forEach((set, mapKey) => set.forEach((setKey) => callback(setKey, mapKey))) },
    forEachSet: (callback) => { map.forEach(callback) }, // set, mapKey
    forEachOfSet: (mapKey, callback) => {
      const set = map.get(mapKey)
      set && set.forEach(callback) // setKey, set
    }
  }
}

const getInvertSetMap = (sourceSetMap, targetSetMap = createSetMap()) => { // NOTE: may loss some value with same setKey
  sourceSetMap.forEach((setKey, mapKey) => targetSetMap.add(setKey, mapKey))
  return targetSetMap
}

export {
  createSetMap,
  getInvertSetMap
}
