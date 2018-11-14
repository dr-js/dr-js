import { isBasicObject } from 'source/common/check'

// NOTE: all method do not check if the value is a valid object

const objectSet = (object, key, value) => (object[ key ] !== value)
  ? { ...object, [ key ]: value }
  : object

const objectDelete = (object, key) => {
  if (!object.hasOwnProperty(key)) return object
  const result = { ...object }
  delete result[ key ]
  return result
}

const objectMerge = (object, mergeObject) => {
  for (const [ key, value ] of Object.entries(mergeObject)) { // check if has new data
    if (object[ key ] !== value) return { ...object, ...mergeObject }
  }
  return object
}

const objectMap = (object, mapFunc) => {
  const result = {}
  for (const [ key, value ] of Object.entries(object)) result[ key ] = mapFunc(value, key)
  return result
}

const objectPickKey = (object, keyList) => { // not copy value from prototype
  const result = {}
  for (const key of keyList) {
    if (object.hasOwnProperty(key)) result[ key ] = object[ key ]
  }
  return result
}

const objectFindKey = (object, findEntryFunc) => {
  const entry = Object.entries(object).find(findEntryFunc)
  return entry && entry[ 0 ] // return String or undefined
}

const objectDeleteUndefined = (object) => {
  let result
  for (const [ key, value ] of Object.entries(object)) { // check if has new data
    if (value !== undefined) continue
    if (result === undefined) result = { ...object }
    delete result[ key ]
  }
  return result || object
}

const objectDepthFirstSearch = (object, checkFunc) => { // TODO: DEPRECATE: use `common/data/Tree`
  const stack = []
  unshiftStack(stack, object, 0)
  while (stack.length) {
    const [ key, value, index, level ] = stack.shift()
    if (checkFunc(value, key, index, level)) return { value, key, index, level }
    unshiftStack(stack, value, level + 1)
  }
}
const unshiftStack = (stack, object, level) => isBasicObject(object) && stack.unshift( // TODO: DEPRECATE: use `common/data/Tree`
  ...Object.entries(object)
    .map(([ key, value ], index) => [ key, value, index, level ])
)

export {
  objectSet,
  objectDelete,
  objectMerge,
  objectMap,
  objectPickKey,
  objectFindKey,
  objectDeleteUndefined,
  objectDepthFirstSearch // TODO: DEPRECATE: use `common/data/Tree`
}
