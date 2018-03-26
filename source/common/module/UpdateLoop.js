import { now, requestFrameUpdate, cancelFrameUpdate, createTimer } from 'source/common/time'
import { objectSet, objectDelete } from 'source/common/immutable/Object'

const createUpdater = () => {
  let funcList = [] // prefer drop, index non-constant, will be refreshed on every update
  let funcMap = {} // prefer keep, key constant, will be refreshed on every update
  let prevTime = now()

  const clear = () => {
    funcList = []
    funcMap = {}
  }
  const pushFunc = (func) => { funcList.push(func) }
  const setFunc = (key, func) => { funcMap = objectSet(funcMap, key, func) } // will replace
  const deleteFunc = (key) => { funcMap = objectDelete(funcMap, key) }
  const update = () => {
    const time = now()
    const deltaTime = time - prevTime
    const doUpdate = (func) => func(deltaTime)
    prevTime = time
    if (funcList.length) funcList = funcList.filter(doUpdate) // return true to quit update
    Object.values(funcMap).forEach(doUpdate)
  }

  return { clear, pushFunc, setFunc, deleteFunc, update }
}

const createUpdateLoop = (option = {}) => {
  const { queueTask = requestFrameUpdate, cancelTask = cancelFrameUpdate, delay } = option
  const { clear, pushFunc, setFunc, deleteFunc, update } = createUpdater()
  const { start, stop } = createTimer({ func: update, queueTask, cancelTask, delay })
  return { start, stop, clear, pushFunc, setFunc, deleteFunc }
}

export { createUpdater, createUpdateLoop }
