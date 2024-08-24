import { isBasicObject } from 'source/common/check.js'
import { compareStringLocale } from 'source/common/compare.js'

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

// TODO: NOTE: not all object key is "sortable" in ES2020, there's hard order for:
//   - Numeric array keys
//   - non-Symbol keys, in insertion order
//   - Symbol keys, in insertion order
//   so
//   { '1a': 1, '01': 2, '24': 3 } will be sort to
//   { '24': 3, '01': 2, '1a': 1 } instead of
//   { '01': 2, '24': 3, '1a': 1 }
//   as '24' is Numeric array key
//   check: https://stackoverflow.com/questions/30076219/does-es6-introduce-a-well-defined-order-of-enumeration-for-object-properties/60121411#60121411
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
