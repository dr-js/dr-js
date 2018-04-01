import { catchAsync } from 'source/common/error'

const createSaveQueue = ({ beforeSave, doSave, afterSave, onError }) => {
  let dataQueue = []
  let isSaving = false

  const saveAsync = async () => {
    if (isSaving) throw new Error(`[saveAsync] already saving`)
    if (!dataQueue.length) return
    const savingDataQueue = dataQueue
    dataQueue = []
    isSaving = true
    beforeSave && beforeSave()
    const { result, error } = await catchAsync(doSave, savingDataQueue)
    isSaving = false
    afterSave && afterSave()
    if (error) onError(error)
    else return result
  }

  const getLength = () => dataQueue.length
  const getIsSaving = () => isSaving
  const clear = () => { dataQueue = [] }
  const add = (data) => dataQueue.push(data)
  const save = () => { !isSaving && saveAsync() }

  return { getLength, getIsSaving, clear, add, save }
}

export { createSaveQueue }
