class IndexBox {
  constructor (min = 0, max = Infinity) {
    this.taken = []
    this.min = min
    this.max = max
  }

  getExactly (index) {
    if (index < this.min || index > this.max || this.taken[ index ]) return null
    this.taken[ index ] = true
    return index
  }

  get (expect) {
    const origin = Math.round(expect)
    let offset = 0
    while (true) {
      if (this.getExactly(origin + offset) !== null) return origin + offset
      if (this.getExactly(origin - offset) !== null) return origin - offset
      offset++
    }
  }
}

export { IndexBox }
