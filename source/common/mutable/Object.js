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

export {
  objectMergeDeep,
  objectSortKey
}
