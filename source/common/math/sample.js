const getSample = (func, size) => {
  const result = []
  for (let index = 0; index < size; index++) result.push(func(index))
  return result
}

// from <= to
// returns [ from, from + 1, from + 2, ..., to -2, to - 1, to ]
const getSampleRange = (from, to) => getSample(
  (index) => (index + from),
  to - from + 1
)

// divide = 1, 2, 3, ...
// returns [ 0, 1 / divide, 2 / divide, ..., (divide - 1) / divide, 1 ]
const getSampleRate = (divide) => getSample(
  (index) => index / divide,
  1 + divide
)

export {
  getSample,
  getSampleRange,
  getSampleRate
}
