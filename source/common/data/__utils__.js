const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) hash = ((hash << 5) - hash + string.charCodeAt(index)) << 0 // Convert to 32bit integer
  return hash >>> 0 // drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
}

// TODO: separate to one data type per-file like `common/mutable/Object`
const objectMergeDeep = (object, merge) => {
  for (const [ key, mergeValue ] of Object.entries(merge)) {
    const objectValue = object[ key ]
    if (objectValue === mergeValue) continue
    object[ key ] = (objectValue instanceof Object) && (mergeValue instanceof Object)
      ? objectMergeDeep(objectValue, mergeValue)
      : mergeValue
  }
  return object
}
const objectSortKey = (object) => {
  Object.keys(object).sort((a, b) => a.localeCompare(b)).forEach((key) => {
    const value = object[ key ]
    delete object[ key ] // change key order by delete & set
    object[ key ] = value
  })
  return object
}
const isObjectContain = (object, target) => Object.entries(target).every(([ key, value ]) => object[ key ] === value)

const arraySplitChunk = (array, chunkLength) => {
  const result = []
  for (let index = 0, indexMax = array.length; index < indexMax; index += chunkLength) result.push(array.slice(index, index + chunkLength))
  return result
}

export {
  hashStringToNumber,

  objectMergeDeep,
  objectSortKey,
  isObjectContain,

  arraySplitChunk
}
