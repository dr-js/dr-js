// NOTE: all method do not check if the value is a valid object

const objectSet = (object, key, value) => (object[ key ] !== value)
  ? { ...object, [ key ]: value }
  : object

const objectDelete = (object, key) => {
  if (!Object.prototype.hasOwnProperty.call(object, key)) return object
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
    if (Object.prototype.hasOwnProperty.call(object, key)) result[ key ] = object[ key ]
  }
  return result
}

const objectFindKey = (object, findEntryFunc) => {
  const entry = Object.entries(object).find(findEntryFunc)
  return entry && entry[ 0 ] // return String or undefined
}

const objectFilter = (object, filterFunc) => {
  let result
  for (const [ key, value ] of Object.entries(object)) { // check if has new data
    if (filterFunc(value, key, object)) continue
    if (result === undefined) result = { ...object }
    delete result[ key ]
  }
  return result || object
}

const objectFromEntries = (iterable) => { // TODO: NOTE: use `Object.fromEntries` when support to node@>=12.0.0 && chrome@>=73 && firefox@>=63 ?
  const result = {}
  for (const [ key, value ] of iterable) result[ key ] = value
  return result
}

export {
  objectSet,
  objectDelete,
  objectMerge,
  objectMap,
  objectPickKey,
  objectFindKey,
  objectFilter,
  objectFromEntries
}
