import { catchAsync } from 'source/common/error.js'

const EMPTY_FUNC = () => {}

const createSaveQueue = ({
  onError,
  doSave,
  beforeSave = EMPTY_FUNC,
  afterSave = EMPTY_FUNC
}) => {
  let dataQueue = []
  let isSaving = false
  let savingState = {} // for doSave to expose save state, do not leak unnecessary info

  const setSavingState = (nextSavingState) => { savingState = nextSavingState }
  const saveAsync = async () => {
    beforeSave()
    const savingDataQueue = dataQueue
    dataQueue = []
    isSaving = true
    const { error } = await catchAsync(doSave, savingDataQueue, setSavingState)
    isSaving = false
    savingState = {}
    if (error) throw error
    afterSave()
  }

  return {
    clear: () => { dataQueue = [] },
    add: (data) => dataQueue.push(data),
    save: () => { !isSaving && dataQueue.length && saveAsync().catch(onError) },
    filter: (filterFunc) => { dataQueue = dataQueue.filter(filterFunc) },
    getLength: () => dataQueue.length,
    getIsSaving: () => isSaving,
    getSavingState: () => savingState
  }
}

export { createSaveQueue }
