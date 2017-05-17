// random
const __getRandomInt = (from, to) => Math.floor(Math.random() * (to - from + 1) + from) // range [from, to] // this will not auto swap, meaning <from> should be smaller than <to>

const getRandomInt = (a, b = 0) => __getRandomInt(Math.min(a, b), Math.max(a, b))

const getRandomIntList = (a, b, count) => { // the result will be from small to big
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const resultList = []
  for (let i = 0, iMax = Math.min(count, (to - from + 1)); i < iMax; i++) {
    let next = __getRandomInt(from, to - i)
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
