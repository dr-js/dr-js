class SetMap {
  static getInvertSetMap (sourceSetMap, targetSetMap = new SetMap()) {
    sourceSetMap.forEach((setKey, mapKey) => targetSetMap.add(setKey, mapKey))
    return targetSetMap
  }

  constructor () { this.map = new Map() }

  clear () { this.map.clear() }

  add (mapKey, setKey) {
    let set = this.map.get(mapKey)
    if (set === undefined) {
      set = new Set()
      this.map.set(mapKey, set)
    }
    set.add(setKey)
  }

  delete (mapKey, setKey) {
    const set = this.map.get(mapKey)
    if (!set || !set.delete(setKey)) return false
    set.size === 0 && this.map.delete(mapKey)
    return true
  }

  has (mapKey, setKey) {
    const set = this.map.get(mapKey)
    return Boolean(set && set.has(setKey))
  }

  forEach (callback) { this.map.forEach((set, mapKey) => set.forEach((setKey) => callback(setKey, mapKey))) }

  forEachSet (callback) { this.map.forEach(callback) } // set, mapKey
}

export { SetMap }
