// NOTE: index should be Integer
const createIndexBox = (min = 0, max = Infinity, initialIndexList = []) => { // TODO: DEPRECATE: not using?
  const indexSet = new Set(initialIndexList)

  const getExactly = (index) => {
    if (index < min || index > max || indexSet.has(index)) return null
    indexSet.add(index)
    return index
  }
  const get = (expectNumber) => {
    const expect = Math.round(expectNumber)
    let offset = 0
    while (true) {
      if (getExactly(expect + offset) !== null) return expect + offset
      if (getExactly(expect - offset) !== null) return expect - offset
      offset++
    }
  }

  return { getExactly, get }
}

export { createIndexBox }
