// NOTE: all method do not check if the value is valid

const objectSet = (object, key, value) => (object[ key ] !== value)
  ? { ...object, [ key ]: value }
  : object

const objectDelete = (object, key) => {
  if (!object.hasOwnProperty(key)) return object
  const result = { ...object }
  delete result[ key ]
  return result
}

const objectMerge = (object, merge) => {
  for (const [ key, value ] of Object.entries(merge)) { // check if has new data
    if (object[ key ] !== value) return { ...object, ...merge }
  }
  return object
}

const objectPickKey = (object, keyList) => {
  const result = {}
  for (const key of keyList) {
    if (object.hasOwnProperty(key)) result[ key ] = object[ key ]
  }
  return result
}

export {
  objectSet,
  objectDelete,
  objectMerge,
  objectPickKey
}
