import { isObjectContain, arraySplitChunk } from './__utils__'

const getArrayChunk = arraySplitChunk // TODO: DEPRECATED
const matchObjectEntry = isObjectContain // TODO: DEPRECATED

export { getArrayChunk, matchObjectEntry } // TODO: DEPRECATED
export { KeySwitch, composeSelectorList, composeKey } from './KeySwitch' // TODO: DEPRECATED

export {
  hashStringToNumber,
  objectMergeDeep,
  objectSortKey,
  isObjectContain,
  arraySplitChunk
} from './__utils__'
export { IndexBox } from './IndexBox'
export { ListMap } from './ListMap'
export { SetMap } from './SetMap'
export { DoublyLinkedList } from './LinkedList'
export { CacheMap } from './CacheMap'
export { createIdPool } from './IdPool'
export { createToggle } from './Toggle'
export { createLogQueue } from './LogQueue'
