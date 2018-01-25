export { IndexBox } from './IndexBox'
export { ListMap } from './ListMap'
export { SetMap } from './SetMap'
export { DoublyLinkedList } from './LinkedList'
export { CacheMap } from './CacheMap'
export { KeySwitch, composeSelectorList, composeKey } from './KeySwitch' // TODO: DEPRECATED
export { createIdPool } from './IdPool'
export { createToggle } from './Toggle'
export { createLogQueue } from './LogQueue'

const hashStringToNumber = (string = '', hash = 0) => {
  for (let index = 0, indexMax = string.length; index < indexMax; index++) hash = ((hash << 5) - hash + string.charCodeAt(index)) << 0 // Convert to 32bit integer
  return hash >>> 0 // drop the sign bit (for +/-), so result range will be: [0, 2^32-1]
}

const getArrayChunk = (array, chunkLength) => {
  const resultArray = []
  for (let index = 0, indexMax = array.length; index < indexMax; index += chunkLength) resultArray.push(array.slice(index, index + chunkLength))
  return resultArray
}

export {
  hashStringToNumber,
  getArrayChunk
}
