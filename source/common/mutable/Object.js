import { compareStringLocale } from 'source/common/compare'

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

const objectSortKey = (object, compare = compareStringLocale) => {
  Object.keys(object)
    .sort(compare)
    .forEach((key) => {
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
