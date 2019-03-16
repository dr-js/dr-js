// NOTE:
//   - all method do not check if the array is a valid array
//   - index should be valid [ 0 , array.length - 1 ]
//   - set operation should either add/update

const arraySet = (array, index, value) => {
  if (array[ index ] === value) return array
  const result = [ ...array ]
  result[ index ] = value
  return result
}

const arrayDelete = (array, index) => (index >= 0 && index <= array.length - 1)
  ? [ ...array.slice(0, index), ...array.slice(index + 1) ]
  : array

const arrayInsert = (array, index, value) => [ ...array.slice(0, index), value, ...array.slice(index) ] // ALWAYS CHANGE

const arrayMove = (array, index, fromIndex) => (fromIndex === index)
  ? array
  : (fromIndex < index)
    ? [ ...array.slice(0, fromIndex), ...array.slice(fromIndex + 1, index + 1), array[ fromIndex ], ...array.slice(index + 1) ]
    : [ ...array.slice(0, index), array[ fromIndex ], ...array.slice(index, fromIndex), ...array.slice(fromIndex + 1) ]

const arrayPush = (array, value) => [ ...array, value ] // ALWAYS CHANGE

const arrayUnshift = (array, value) => [ value, ...array ] // ALWAYS CHANGE

const arrayPop = (array) => {
  if (array.length === 0) return array
  const result = [ ...array ]
  result.pop()
  return result
}

const arrayShift = (array) => {
  if (array.length === 0) return array
  const result = [ ...array ]
  result.shift()
  return result
}

const arrayConcat = (array, concatArray) => (concatArray && concatArray.length)
  ? [ ...array, ...concatArray ]
  : array

// match: compare with ===

const arrayMatchPush = (array, value) => !array.includes(value)
  ? [ ...array, value ]
  : array

const arrayMatchDelete = (array, value) => {
  const index = array.indexOf(value)
  return ~index
    ? [ ...array.slice(0, index), ...array.slice(index + 1) ]
    : array
}

const arrayMatchMove = (array, index, value) => {
  const fromIndex = array.indexOf(value)
  return ~fromIndex
    ? arrayMove(array, index, fromIndex)
    : array
}

// find / find or: find with findFunc

const arrayFindDelete = (array, findFunc) => {
  const index = array.findIndex(findFunc)
  return ~index
    ? [ ...array.slice(0, index), ...array.slice(index + 1) ]
    : array
}

const arrayFindMove = (array, findFunc, index) => {
  const fromIndex = array.findIndex(findFunc)
  return ~fromIndex
    ? arrayMove(array, index, fromIndex)
    : array
}

const arrayFindSet = (array, findFunc, value) => {
  const index = array.findIndex(findFunc)
  if (!~index || array[ index ] === value) return array
  const result = [ ...array ]
  result[ index ] = value
  return result
}

const arrayFindSetOrPush = (array, findFunc, value) => {
  const index = array.findIndex(findFunc)
  if (!~index) return [ ...array, value ] // push
  if (array[ index ] === value) return array
  const result = [ ...array ]
  result[ index ] = value
  return result // set
}

const arrayFindOrPush = (array, findFunc, value) => array.find(findFunc) === undefined
  ? [ ...array, value ]
  : array

// misc

const arraySplitChunk = (array, chunkLength) => { // chunkLength should be Positive Integer (1, 2, 3 ...)
  const result = []
  for (let index = 0, indexMax = array.length; index < indexMax; index += chunkLength) {
    result.push(array.slice(index, index + chunkLength))
  }
  return result
}

export {
  arraySet,
  arrayDelete,
  arrayInsert,
  arrayMove,
  arrayPush,
  arrayUnshift,
  arrayPop,
  arrayShift,
  arrayConcat,
  arrayMatchDelete,
  arrayMatchPush,
  arrayMatchMove,
  arrayFindDelete,
  arrayFindMove,
  arrayFindSet,
  arrayFindSetOrPush,
  arrayFindOrPush,
  arraySplitChunk
}
