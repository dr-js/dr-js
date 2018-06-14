const createIndexBox = (min = 0, max = Infinity) => {
  const taken = []

  const getExactly = (index) => {
    if (index < min || index > max || taken[ index ]) return null
    taken[ index ] = true
    return index
  }

  const get = (expect) => {
    const origin = Math.round(expect)
    let offset = 0
    while (true) {
      if (getExactly(origin + offset) !== null) return origin + offset
      if (getExactly(origin - offset) !== null) return origin - offset
      offset++
    }
  }

  return { getExactly, get }
}

export { createIndexBox }
