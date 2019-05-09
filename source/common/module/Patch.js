// TODO: NOTE:
//   patch data should be:
//     use immutable update
//     have NAME_KEY, NAME_MODIFY_TIME

const createPatchKit = ({
  NAME_KEY = 'key',
  NAME_MODIFY_TIME = 'mtime',
  EPSILON_MODIFY_TIME = 1,

  isChanged = (data, prevData) => data[ NAME_MODIFY_TIME ] !== prevData[ NAME_MODIFY_TIME ],
  shouldApplyDelete = (data, prevData) => data[ NAME_MODIFY_TIME ] >= prevData[ NAME_MODIFY_TIME ], // since delete will use last mtime, so should allow `=` check
  shouldApplyUpdate = (data, prevData) => data[ NAME_MODIFY_TIME ] > prevData[ NAME_MODIFY_TIME ], // only allow bigger mtime
  getPatchData = (data, prevData) => data[ NAME_MODIFY_TIME ] < prevData[ NAME_MODIFY_TIME ]
    ? { ...data, [ NAME_MODIFY_TIME ]: prevData[ NAME_MODIFY_TIME ] + EPSILON_MODIFY_TIME } // use old data as future data, step NAME_MODIFY_TIME up for EPSILON_MODIFY_TIME
    : data // normal new data
}) => {
  const hasPatch = (
    dataMap, // { NAME_KEY: { NAME_KEY, NAME_MODIFY_TIME } } // TODO: NOTE: will mutate this map, pass new map in every time, do not reuse
    prevDataList // [ { NAME_KEY, NAME_MODIFY_TIME } ]
  ) => {
    for (let index = 0, indexMax = prevDataList.length; index < indexMax; index++) {
      const prevData = prevDataList[ index ]
      const key = prevData[ NAME_KEY ]
      const data = dataMap.get(key)
      if (data === undefined) return true
      else if (isChanged(data, prevData)) return true
      dataMap.delete(key)
    }
    return dataMap.size >= 1
  }

  const countPatch = (
    dataMap, // { NAME_KEY: { NAME_KEY, NAME_MODIFY_TIME } } // TODO: NOTE: will mutate this map, pass new map in every time, do not reuse
    prevDataList // [ { NAME_KEY, NAME_MODIFY_TIME } ]
  ) => {
    let count = 0
    for (let index = 0, indexMax = prevDataList.length; index < indexMax; index++) {
      const prevData = prevDataList[ index ]
      const key = prevData[ NAME_KEY ]
      const data = dataMap.get(key)
      if (data === undefined) count++
      else if (isChanged(data, prevData)) count++
      dataMap.delete(key)
    }
    count += dataMap.size
    return count
  }

  const generatePatch = (
    dataMap, // { NAME_KEY: { NAME_KEY, NAME_MODIFY_TIME } } // TODO: NOTE: will mutate this map, pass new map in every time, do not reuse
    prevDataList // [ { NAME_KEY, NAME_MODIFY_TIME } ]
  ) => {
    const deleteList = []
    const updateList = []
    for (let index = 0, indexMax = prevDataList.length; index < indexMax; index++) {
      const prevData = prevDataList[ index ]
      const key = prevData[ NAME_KEY ]
      const data = dataMap.get(key)
      if (data === undefined) deleteList.push({ [ NAME_KEY ]: key, [ NAME_MODIFY_TIME ]: prevData[ NAME_MODIFY_TIME ] }) // delete, pass NAME_KEY & NAME_MODIFY_TIME only
      else if (isChanged(data, prevData)) updateList.push(getPatchData(data, prevData)) // update
      dataMap.delete(key)
    }
    dataMap.forEach((data) => {
      updateList.push(data) // add
    })
    return { deleteList, updateList }
  }

  const applyPatch = (
    deleteList, // [ { NAME_KEY, NAME_MODIFY_TIME } ]
    updateList, // [ { NAME_KEY, NAME_MODIFY_TIME } ]
    dataList, // [ { NAME_KEY, NAME_MODIFY_TIME } ]
    onData // (data, prevData) => {}
  ) => {
    let isChanged = false
    const deleteMap = deleteList.reduce(arrayMapReducer, new Map())
    const updateMap = updateList.reduce(arrayMapReducer, new Map())
    for (const data of dataList) {
      const key = data[ NAME_KEY ]
      const deleteData = deleteMap.get(key)
      if (deleteData !== undefined && shouldApplyDelete(deleteData, data)) {
        onData(undefined, data) // delete by drop
        isChanged = true
        continue
      }
      const updateData = updateMap.get(key)
      if (updateData !== undefined) {
        updateMap.delete(key)
        if (shouldApplyUpdate(updateData, data)) {
          onData(updateData, data) // update by replace
          isChanged = true
          continue
        }
      }
      onData(data, data) // keep
    }
    updateMap.forEach((data) => {
      onData(data, undefined) // update by append
      isChanged = true
    })
    return isChanged
  }
  const arrayMapReducer = (o, value) => o.set(value[ NAME_KEY ], value)

  return {
    NAME_KEY,
    NAME_MODIFY_TIME,
    isChanged,
    shouldApplyDelete,
    shouldApplyUpdate,

    hasPatch,
    countPatch,
    generatePatch,
    applyPatch,

    arrayMapReducer
  }
}

const toObjectPatchKit = (patchKit) => {
  const {
    NAME_KEY,
    hasPatch,
    countPatch,
    generatePatch,
    applyPatch
  } = patchKit

  const hasObjectPatch = (object, prevObject) => hasPatch(
    new Map(Object.entries(object)), // TODO: still cost a lot
    Object.values(prevObject) // TODO: still cost a lot
  )
  const countObjectPatch = (object, prevObject) => countPatch(
    new Map(Object.entries(object)),
    Object.values(prevObject)
  )
  const generateObjectPatch = (object, prevObject) => generatePatch(
    new Map(Object.entries(object)),
    Object.values(prevObject)
  )
  const applyObjectPatch = (object, { deleteList, updateList }) => {
    const nextObject = {}
    const isChanged = applyPatch(
      deleteList,
      updateList,
      Object.values(object),
      (data, prevData) => { if (data !== undefined) nextObject[ data[ NAME_KEY ] ] = data }
    )
    return isChanged ? nextObject : object
  }

  return {
    hasObjectPatch,
    countObjectPatch,
    generateObjectPatch,
    applyObjectPatch
  }
}

const toArrayWithKeyPatchKit = (patchKit) => {
  const {
    hasPatch,
    countPatch,
    generatePatch,
    applyPatch,

    arrayMapReducer
  } = patchKit

  const hasArrayWithKeyPatch = (array, prevArray) => hasPatch(
    array.reduce(arrayMapReducer, new Map()), // TODO: still cost a lot
    prevArray
  )
  const countArrayWithKeyPatch = (array, prevArray) => countPatch(
    array.reduce(arrayMapReducer, new Map()),
    prevArray
  )
  const generateArrayWithKeyPatch = (array, prevArray) => generatePatch(
    array.reduce(arrayMapReducer, new Map()),
    prevArray
  )
  const applyArrayWithKeyPatch = (array, { deleteList, updateList }) => {
    const nextArray = []
    const isChanged = applyPatch(
      deleteList,
      updateList,
      array,
      (data, prevData) => { if (data !== undefined) nextArray.push(data) }
    )
    return isChanged ? nextArray : array
  }

  return {
    hasArrayWithKeyPatch,
    countArrayWithKeyPatch,
    generateArrayWithKeyPatch,
    applyArrayWithKeyPatch
  }
}

export {
  createPatchKit,
  toObjectPatchKit,
  toArrayWithKeyPatchKit
}
