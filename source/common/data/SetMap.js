const createSetMap = () => {
  const map = new Map()

  const get = (mapKey, setKey) => {
    const set = map.get(mapKey)
    return set && set.get(setKey)
  }

  return {
    clear: () => { map.clear() },
    add: (mapKey, setKey) => {
      let set = map.get(mapKey)
      if (set === undefined) {
        set = new Set()
        map.set(mapKey, set)
      }
      set.add(setKey)
    },
    delete: (mapKey, setKey) => {
      const set = map.get(mapKey)
      if (!set || !set.delete(setKey)) return false
      set.size === 0 && map.delete(mapKey)
      return true
    },
    get,
    has: (mapKey, setKey) => Boolean(get(mapKey, setKey)),
    forEach: (callback) => { map.forEach((set, mapKey) => set.forEach((setKey) => callback(setKey, mapKey))) },
    forEachSet: (callback) => { map.forEach(callback) }, // set, mapKey
    forEachMap: (mapKey, callback) => {
      const set = map.get(mapKey)
      set && set.forEach(callback)
    }
  }
}

const getInvertSetMap = (sourceSetMap, targetSetMap = createSetMap()) => {
  sourceSetMap.forEach((setKey, mapKey) => targetSetMap.add(setKey, mapKey))
  return targetSetMap
}

export {
  createSetMap,
  getInvertSetMap
}
