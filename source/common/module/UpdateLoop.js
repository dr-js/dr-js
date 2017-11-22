import { now, onNextProperUpdate } from 'source/common/time'

const createUpdateLoop = () => {
  let isActive = false
  let updateFuncList = [] // index non-constant, will be refreshed on every update
  let updateFuncMap = new Map() // key constant, will be refreshed on every update
  let lastUpdateTime = now()
  let clearUpdate

  const start = () => {
    isActive = true
    clearUpdate = onNextProperUpdate(update)
  }

  const stop = () => {
    isActive = false
    clearUpdate()
  }

  const clear = () => {
    updateFuncList = [] // index non-constant, will be refreshed on every update
    updateFuncMap = new Map() // key constant, will be refreshed on every update
  }

  const add = (updateFunc, key) => key ? updateFuncMap.set(key, updateFunc) : updateFuncList.push(updateFunc)

  const update = () => {
    const currentUpdateTime = now()
    const deltaTime = currentUpdateTime - lastUpdateTime
    lastUpdateTime = currentUpdateTime

    const nextUpdateFuncList = []
    updateFuncList.forEach((updateFunc) => updateFunc(deltaTime) && nextUpdateFuncList.push(updateFunc))
    updateFuncList = nextUpdateFuncList

    const nextUpdateFuncMap = new Map()
    updateFuncMap.forEach((updateFunc, key) => updateFunc(deltaTime) && nextUpdateFuncMap.set(key, updateFunc))
    updateFuncMap = nextUpdateFuncMap

    if (isActive) clearUpdate = onNextProperUpdate(update)
  }

  return { start, stop, clear, add }
}

export { createUpdateLoop }
