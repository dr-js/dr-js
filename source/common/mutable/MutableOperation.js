const objectMergeDeep = (object, merge) => { // TODO: DEPRECATED
  for (const [ key, mergeValue ] of Object.entries(merge)) { // check if has new data
    const objectValue = object[ key ]
    if (objectValue === mergeValue) continue
    if (!(objectValue instanceof Object)) object[ key ] = mergeValue
    else object[ key ] = objectMergeDeep(objectValue, mergeValue)
  }
  return object
}

export {
  objectMergeDeep // TODO: DEPRECATED
}
