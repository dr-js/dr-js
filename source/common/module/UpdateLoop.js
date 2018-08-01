import { CLOCK_TO_SECOND, requestFrameUpdate, cancelFrameUpdate, createTimer } from 'source/common/time'
import { objectSet, objectDelete } from 'source/common/immutable/Object'

const createUpdater = () => {
  let funcList // prefer drop, index non-constant, will be refreshed on every update
  let funcMap // prefer keep, key constant
  let funcMapValueList
  let prevTime

  const clear = () => {
    funcList = []
    funcMap = {}
    funcMapValueList = []
    prevTime = Date.now()
  }
  const pushFunc = (func) => { funcList.push(func) } // no de-duplication for func
  const setFunc = (key, func) => { // will replace if key is the same
    funcMap = objectSet(funcMap, key, func)
    funcMapValueList = Object.values(funcMap)
  }
  const deleteFunc = (key) => {
    funcMap = objectDelete(funcMap, key)
    funcMapValueList = Object.values(funcMap)
  }
  const update = () => {
    const time = Date.now()
    const deltaTime = time - prevTime
    const doUpdate = (func) => func(deltaTime * CLOCK_TO_SECOND)
    prevTime = time
    if (funcList.length) funcList = funcList.filter(doUpdate) // return true to quit update
    funcMapValueList.forEach(doUpdate)
  }

  clear()

  return { clear, pushFunc, setFunc, deleteFunc, update }
}

const createUpdateLoop = ({
  delay,
  queueTask = requestFrameUpdate,
  cancelTask = cancelFrameUpdate
} = {}) => {
  const { clear, pushFunc, setFunc, deleteFunc, update } = createUpdater()
  const { start, stop } = createTimer({ func: update, queueTask, cancelTask, delay })
  return { start, stop, clear, pushFunc, setFunc, deleteFunc }
}

export { createUpdater, createUpdateLoop }
