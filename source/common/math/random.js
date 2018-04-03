// range [from, to] // this will not auto swap, meaning <from> should be smaller than <to>
const RANDOM_INT = (from, to) => Math.floor(Math.random() * (to - from + 1) + from)

const getRandomInt = (a, b = 0) => RANDOM_INT(Math.min(a, b), Math.max(a, b))

// the result will be from small to big
const getRandomIntList = (a, b, count) => {
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const resultList = []
  for (let i = 0, iMax = Math.min(count, (to - from + 1)); i < iMax; i++) {
    let next = RANDOM_INT(from, to - i)
    let j = 0
    while (j < resultList.length) {
      if (resultList[ j ] > next) break
      next++
      j++
    }
    resultList.splice(j, 0, next)
  }
  return resultList
}

const getRandomId = (prefix = '') => `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export {
  getRandomInt,
  getRandomIntList,
  getRandomId
}
