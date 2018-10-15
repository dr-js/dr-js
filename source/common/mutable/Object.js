import { isBasicObject } from 'source/common/check'
import { compareStringLocale } from 'source/common/compare'

const objectMergeDeep = (object, mergeObject) => {
  Object.entries(mergeObject).forEach(([ key, mergeValue ]) => {
    const objectValue = object[ key ]
    if (objectValue === mergeValue) return
    object[ key ] = isBasicObject(objectValue) && isBasicObject(mergeValue) // do not merge array, just replace
      ? objectMergeDeep(objectValue, mergeValue)
      : mergeValue
  })
  return object
}

const objectSortKey = (object, compareKeyFunc = compareStringLocale) => {
  Object.keys(object).sort(compareKeyFunc).forEach((key) => {
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
