// function that accepts 2 same typed value and returns -1, 0, 1

// faster, a != A
const compareString = (a, b) => (a < b) ? -1
  : (a > b) ? 1
    : 0

// slower, a == A
const compareStringLocale = (a, b) => a.localeCompare(b)

// TODO: wait for support and just use Intl like: `'a10'.localeCompare('a2', undefined, { numeric: true })`
// check: https://stackoverflow.com/questions/2802341/javascript-natural-sort-of-alphanumerical-strings
const compareStringWithNumber = (a = '', b = '') => { // will try to compare number if diff happened there (mostly used in `natural sort`)
  if (a === b) return 0

  // find the start of the diff
  let diffIndex = -1 // for the first ++
  let aCharCode, bCharCode // can be NaN
  do {
    diffIndex++
    aCharCode = a.charCodeAt(diffIndex)
    bCharCode = b.charCodeAt(diffIndex)
  } while (aCharCode === bCharCode)

  // NOTE: tricky case:
  //   diff at number-string, and should back check the number
  //     12345a
  //     123a
  //   diff at number-string, and should not back check
  //     aaa45a
  //     aaaa
  const isNumberA = isNumberCharCode(aCharCode)
  const isNumberB = isNumberCharCode(bCharCode)

  if (
    (isNumberA && (isNumberB || isNumberCharCode(b.charCodeAt(diffIndex - 1)))) ||
    (isNumberB && (isNumberA || isNumberCharCode(a.charCodeAt(diffIndex - 1))))
  ) { // get and diff the number
    const aNumber = getNumberAtIndex(a, isNumberA ? diffIndex : diffIndex - 1)
    const bNumber = getNumberAtIndex(b, isNumberB ? diffIndex : diffIndex - 1)
    return aNumber - bNumber
  } else return (aCharCode || 0) - (bCharCode || 0) // not number, just compare charCode
}

const CHAR_CODE_0 = 48 // '0'.charCodeAt(0)
const CHAR_CODE_9 = 57 // '9'.charCodeAt(0)
const isNumberCharCode = (charCode) => (
  charCode >= CHAR_CODE_0 &&
  charCode <= CHAR_CODE_9
)
const getNumberAtIndex = (string = '', index) => {
  let indexStart = index - 1
  let indexEnd = index + 1
  while (isNumberCharCode(string.charCodeAt(indexStart))) indexStart--
  while (isNumberCharCode(string.charCodeAt(indexEnd))) indexEnd++
  return Number(string.slice(indexStart + 1, indexEnd))
}

export {
  compareString,
  compareStringLocale,
  compareStringWithNumber
}
