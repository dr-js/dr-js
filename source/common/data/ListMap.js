export class ListMap {
  constructor () {
    this.map = new Map()
  }

  add (mapKey, value) {
    let list = this.map.get(mapKey)
    if (list === undefined) {
      list = []
      this.map.set(mapKey, list)
    }
    list.push(value)
  }

  get (mapKey, index) {
    const list = this.map.get(mapKey)
    if (list === undefined) return undefined
    return list[ index ]
  }

  getList (mapKey) {
    return this.map.get(mapKey)
  }

  clear () {
    this.map.clear()
  }

  forEachList (callback) {
    this.map.forEach(callback) // list, mapKey
  }

  forEach (callback) {
    this.map.forEach((list, mapKey) => list.forEach((value) => callback(value, mapKey)))
  }

  has (mapKey, value) {
    const list = this.map.get(mapKey)
    if (list === undefined) return false
    return list.includes(value)
  }

  hasList (mapKey) {
    return this.map.has(mapKey)
  }

  delete (mapKey, value) {
    const list = this.map.get(mapKey)
    const valueIndex = list ? list.indexOf(value) : -1
    if (valueIndex === -1) return false
    list.splice(valueIndex, 1)
    if (list.length === 0) this.map.delete(mapKey)
    return true
  }
}
