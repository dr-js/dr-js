const createListMap = () => {
  const map = new Map()

  return {
    clear: () => { map.clear() },
    add: (mapKey, value) => {
      let list = map.get(mapKey)
      if (list === undefined) {
        list = []
        map.set(mapKey, list)
      }
      list.push(value)
    },
    delete: (mapKey, value) => {
      const list = map.get(mapKey)
      const valueIndex = list ? list.indexOf(value) : -1
      if (valueIndex === -1) return false
      list.splice(valueIndex, 1)
      if (list.length === 0) map.delete(mapKey)
      return true
    },
    get: (mapKey, index) => {
      const list = map.get(mapKey)
      return list && list[ index ]
    },
    getList: (mapKey) => map.get(mapKey),
    has: (mapKey, value) => {
      const list = map.get(mapKey)
      return Boolean(list && list.includes(value))
    },
    hasList: (mapKey) => map.has(mapKey),
    forEach: (callback) => { map.forEach((list, mapKey) => list.forEach((value) => callback(value, mapKey))) },
    forEachList: (callback) => { map.forEach(callback) } // list, mapKey
  }
}

export { createListMap }
