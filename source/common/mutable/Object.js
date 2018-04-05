import { isBasicObject } from 'source/common/check'
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

const objectDepthFirstSearch = (object, func) => {
  const stack = []
  unshiftStack(stack, object, 0)
  while (stack.length) {
    const [ key, value, index, level ] = stack.shift()
    if (func(value, key, index, level)) return { value, key, index, level }
    unshiftStack(stack, value, level + 1)
  }
}
const unshiftStack = (stack, object, level) => isBasicObject(object) && stack.unshift(...Object.entries(object).map(([ key, value ], index) => [ key, value, index, level ]))

export {
  objectMergeDeep,
  objectSortKey,
  objectDepthFirstSearch
}
