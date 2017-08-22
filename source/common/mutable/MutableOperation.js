const objectMergeDeep = (object, merge) => {
  for (const [ key, mergeValue ] of Object.entries(merge)) { // check if has new data
    const objectValue = object[ key ]
    if (objectValue === mergeValue) continue
    if (!(objectValue instanceof Object)) object[ key ] = mergeValue
    else object[ key ] = objectMergeDeep(objectValue, mergeValue)
  }
  return object
}

export const MutableOperation = {
  objectMergeDeep
}
