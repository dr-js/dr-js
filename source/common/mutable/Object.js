import { isBasicObject } from 'source/common/check'
import { compareStringLocale } from 'source/common/compare'

const objectMergeDeep = (object, mergeSource) => {
  Object.entries(mergeSource).forEach(([ key, mergeValue ]) => {
    const objectValue = object[ key ]
    if (objectValue === mergeValue) return
    object[ key ] = isBasicObject(objectValue) && isBasicObject(mergeValue) // do not merge array, just replace
      ? objectMergeDeep(objectValue, mergeValue)
      : mergeValue
  })
  return object
}

const objectSortKey = (object, compare = compareStringLocale) => {
  Object.keys(object).sort(compare).forEach((key) => {
    const value = object[ key ]
    delete object[ key ] // change key order by delete & set
    object[ key ] = value
  })
  return object
}

const objectFindKey = (object, findEntryFunc) => { // TODO: not actually mutate, move to better place
  const entry = Object.entries(object).find(findEntryFunc)
  return entry && entry[ 0 ] // return String or undefined
}

const objectDepthFirstSearch = (object, func) => { // TODO: not actually mutate, move to better place
  const stack = []
  unshiftStack(stack, object, 0)
  while (stack.length) {
    const [ key, value, index, level ] = stack.shift()
    if (func(value, key, index, level)) return { value, key, index, level }
    unshiftStack(stack, value, level + 1)
  }
}
const unshiftStack = (stack, object, level) => isBasicObject(object) && stack.unshift(
  ...Object.entries(object)
    .map(([ key, value ], index) => [ key, value, index, level ])
)

export {
  objectMergeDeep,
  objectSortKey,

  objectFindKey, // TODO: not actually mutate, move to better place
  objectDepthFirstSearch // TODO: not actually mutate, move to better place
}
