// Levenshtein distance algorithm
// edited from https://github.com/sindresorhus/leven

const arr = []
const charCodeCache = []
const getLevenshteinDistance = (a, b) => {
  if (a === b) return 0

  // Swapping the strings if `a` is longer than `b` so we know which one is the shortest & which one is the longest
  if (a.length > b.length) [ a, b ] = [ b, a ]

  // Performing suffix trimming: We can linearly drop suffix common to both strings since they don't increase distance at all
  // Note: `~-` is the bitwise way to perform a `- 1` operation
  let aLen = a.length
  let bLen = b.length
  while (aLen > 0 && (a.charCodeAt(~-aLen) === b.charCodeAt(~-bLen))) {
    aLen--
    bLen--
  }

  // Performing prefix trimming: We can linearly drop prefix common to both strings since they don't increase distance at all
  let start = 0
  while (start < aLen && (a.charCodeAt(start) === b.charCodeAt(start))) start++
  aLen -= start
  bLen -= start

  if (aLen === 0) return 0

  let i = 0
  while (i < aLen) {
    charCodeCache[ i ] = a.charCodeAt(start + i)
    arr[ i ] = ++i
  }

  let bCharCode, ret, tmp, tmp2
  let j = 0
  while (j < bLen) {
    bCharCode = b.charCodeAt(start + j)
    tmp = j++
    ret = j

    for (i = 0; i < aLen; i++) {
      tmp2 = bCharCode === charCodeCache[ i ]
        ? tmp
        : tmp + 1
      tmp = arr[ i ]
      ret = arr[ i ] = tmp > ret
        ? tmp2 > ret
          ? ret + 1
          : tmp2
        : tmp2 > tmp
          ? tmp + 1
          : tmp2
    }
  }

  return ret
}

export { getLevenshteinDistance }