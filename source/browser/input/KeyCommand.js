import { getRandomId } from 'source/common/math/random'
import { isObjectContain } from 'source/common/check'

// TODO: single key, not key sequence
const createKeyCommandListener = (eventSource = window.document) => {
  const keyCommandMap = new Map()
  const keyCommandListener = (event) => keyCommandMap.forEach((keyCommand) => {
    const { target, checkMap, callback } = keyCommand
    if (target && !target.contains(event.target)) return
    if (!isObjectContain(event, checkMap)) return
    event.preventDefault()
    callback(event, keyCommand)
  })
  const clear = () => eventSource.removeEventListener('keydown', keyCommandListener)
  const addKeyCommand = ({ id = getRandomId(), target, checkMap, callback }) => {
    keyCommandMap.set(id, { id, target, checkMap, callback })
    return id
  }
  const deleteKeyCommand = ({ id }) => keyCommandMap.delete(id)
  eventSource.addEventListener('keydown', keyCommandListener)
  return { clear, addKeyCommand, deleteKeyCommand }
}

export { createKeyCommandListener }
