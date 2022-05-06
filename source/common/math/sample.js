// size, expect Integer
const getSample = (func, size) => {
  const result = []
  for (let index = 0; index < size; index++) result.push(func(index))
  return result
}

// from <= to, expect Integer
// returns [ from, from + 1, from + 2, ..., to -2, to - 1, to ]
const getSampleRange = (from, to) => getSample(
  (index) => (index + from),
  to - from + 1
)

// divide = 1, 2, 3 ..., expect Integer
// returns [ 0, 1 / divide, 2 / divide, ..., (divide - 1) / divide, 1 ]
const getSampleRate = (divide) => getSample(
  (index) => index / divide,
  1 + divide
)

const getSampleIterator = (func, size) => ({
  [ Symbol.iterator ]: () => { // as sync iterable
    let index = 0
    const next = () => (index < size)
      ? { value: func(index++), done: false }
      : { value: func(index), done: true }
    return { next }
  }
})
const getSampleIteratorRange = (from, to) => getSampleIterator(
  (index) => (index + from),
  to - from + 1
)
const getSampleIteratorRate = (divide) => getSampleIterator(
  (index) => index / divide,
  1 + divide
)

export {
  getSample, getSampleIterator,
  getSampleRange, getSampleIteratorRange,
  getSampleRate, getSampleIteratorRate
}
