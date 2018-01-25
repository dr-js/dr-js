export class SetMap {
  constructor () {
    this.map = new Map()
  }

  add (mapKey, setKey) {
    let set = this.map.get(mapKey)
    if (set === undefined) {
      set = new Set()
      this.map.set(mapKey, set)
    }
    set.add(setKey)
  }

  clear () {
    this.map.clear()
  }

  forEachSet (callback) {
    this.map.forEach(callback) // set, mapKey
  }

  forEach (callback) {
    this.map.forEach((set, mapKey) => set.forEach((setKey) => callback(setKey, mapKey)))
  }

  has (mapKey, setKey) {
    const set = this.map.get(mapKey)
    if (set === undefined) return false
    return set.has(setKey)
  }

  delete (mapKey, setKey) {
    const set = this.map.get(mapKey)
    if (set === undefined || !set.delete(setKey)) return false
    if (set.size === 0) this.map.delete(mapKey)
    return true
  }

  static getInvertSetMap (sourceSetMap, targetSetMap = new SetMap()) {
    sourceSetMap.forEach((setKey, mapKey) => targetSetMap.add(setKey, mapKey))
    return targetSetMap
  }
}
