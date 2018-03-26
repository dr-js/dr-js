const createSaveQueue = ({ beforeSave, doSave, afterSave, onError }) => {
  let dataQueue = []
  let isSaving = false

  const saveAsync = async () => {
    if (isSaving) throw new Error(`[saveAsync] already saving`)
    if (!dataQueue.length) return
    const savingDataQueue = dataQueue
    clear()
    isSaving = true
    beforeSave()
    try {
      const result = await doSave(savingDataQueue)
      isSaving = false
      afterSave()
      return result
    } catch (error) {
      isSaving = false
      onError(error)
    }
  }

  const getLength = () => dataQueue.length
  const getIsSaving = () => isSaving
  const clear = () => { dataQueue = [] }
  const add = (data) => dataQueue.push(data)
  const save = () => { !isSaving && saveAsync() }

  return { getLength, getIsSaving, clear, add, save }
}

export { createSaveQueue }
