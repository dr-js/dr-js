import { getRandomId } from 'source/common/math/random'
import { isObjectContain } from 'source/common/check'

// TODO: single key, not key sequence
const createKeyCommandHub = ({
  eventSource = window.document,
  isSkipPreventDefault = false // normally preventDefault won't hurt
}) => {
  const keyCommandMap = new Map()
  const keyCommandListener = (event) => keyCommandMap.forEach((keyCommand) => {
    const { target, checkMap, callback } = keyCommand
    if (target && !target.contains(event.target)) return
    if (!isObjectContain(event, checkMap)) return
    !isSkipPreventDefault && event.preventDefault()
    callback(event, keyCommand)
  })

  let isActive = false
  const getIsActive = () => isActive
  const start = () => {
    eventSource.addEventListener('keydown', keyCommandListener)
    isActive = true
  }
  const stop = () => {
    eventSource.removeEventListener('keydown', keyCommandListener)
    isActive = false
  }
  const addKeyCommand = ({ id = getRandomId(), target, checkMap, callback }) => {
    keyCommandMap.set(id, { id, target, checkMap, callback })
    return id
  }
  const deleteKeyCommand = ({ id }) => keyCommandMap.delete(id)

  return {
    getIsActive,
    start,
    stop,
    addKeyCommand,
    deleteKeyCommand
  }
}

export { createKeyCommandHub }
