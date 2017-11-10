export { IndexBox } from './IndexBox'
export { SetMap } from './SetMap'
export { DoublyLinkedList } from './LinkedList'
export { CacheMap } from './CacheMap'
export { KeySwitch, composeSelectorList, composeKey } from './KeySwitch'
export { createIdPool } from './IdPool'
export { createToggle } from './Toggle'
export { createLogQueue } from './LogQueue'

const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) hash = ((hash << 5) - hash + string.charCodeAt(index)) << 0 // Convert to 32bit integer
  return hash >>> 0 // drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
}

export { hashStringToNumber }
