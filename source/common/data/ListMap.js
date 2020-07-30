const createListMap = () => {
  const map = new Map()

  return {
    clear: () => { map.clear() },
    delete: (mapKey, value) => {
      const list = map.get(mapKey)
      const valueIndex = list ? list.indexOf(value) : -1
      if (valueIndex === -1) return false
      list.splice(valueIndex, 1)
      if (list.length === 0) map.delete(mapKey)
      return true
    },
    add: (mapKey, value) => {
      let list = map.get(mapKey)
      if (list === undefined) map.set(mapKey, (list = []))
      list.push(value)
    },
    get: (mapKey, index) => {
      const list = map.get(mapKey)
      return list && list[ index ]
    },
    has: (mapKey, value) => {
      const list = map.get(mapKey)
      return Boolean(list && list.includes(value))
    },
    getList: (mapKey) => map.get(mapKey),
    hasList: (mapKey) => map.has(mapKey),
    forEach: (callback) => { map.forEach((list, mapKey) => list.forEach((value) => callback(value, mapKey))) },
    forEachList: (callback) => { map.forEach(callback) } // list, mapKey
  }
}

export { createListMap }
