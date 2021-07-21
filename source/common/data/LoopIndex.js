// index: integer in range [0, LOOP_INDEX_MAX - 1]
// indexAlike: integer in range [0, +Infinity)
// suppose `LOOP_INDEX_MAX = 4`, the index will loop like:
//   0,1,2,3,0,1,2,3...
const createLoopIndex = (
  LOOP_INDEX_MAX = 2000000000 // smaller than max 32Bit signed (2147483647), so most calc should work
) => {
  const normalize = (indexAlike) => indexAlike % LOOP_INDEX_MAX // loop if needed

  const step = (index, stepCount = 1) => normalize(index + stepCount)

  // use to check if previous index is reached, should work for:
  // - not yet: (1, 2)
  // - not yet: (LOOP_INDEX_MAX - 1, LOOP_INDEX_MAX + 2)
  // - not yet: (LOOP_INDEX_MAX - 1, 2)
  // - reached: (1, 1)
  // - reached: (2, 1)
  // - reached: (2, LOOP_INDEX_MAX)
  const INDEX_GAP = Math.floor(LOOP_INDEX_MAX * 0.5) // assume the index gap always smaller than half of `LOOP_INDEX_MAX`
  const isReached = (index, targetIndexAlike) => {
    const targetIndex = normalize(targetIndexAlike)
    if (targetIndex > index) return false // (1, 2) situation
    if (targetIndex < (index - INDEX_GAP)) return false // (LOOP_INDEX_MAX - 1, 2) situation
    return true
  }

  return { LOOP_INDEX_MAX, normalize, step, isReached }
}

export { createLoopIndex }
