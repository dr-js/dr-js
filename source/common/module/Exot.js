import { isString, isObjectAlike, isBasicFunction } from 'source/common/check.js'
import { getRandomId62S } from 'source/common/math/random.js'

// TODO: still under testing, pattern not stable
// Exot is short for "Exot-ic", a pattern for wrapping external IO or Resource that require manual `up` and `down`.

/** @typedef { Error & { exotId?: string } } ExotError */

/** @type { (exotId: string, message: string) => ExotError } */
const createExotError = (exotId, message) => { // error with exotId
  /** @type { ExotError } */
  const exotError = new Error(message)
  exotError.exotId = exotId
  return exotError
}

/** @typedef { (error: ExotError) => void } OnExotError */
/** @typedef { {
 id: string,
 up: (onExotError: OnExotError) => Promise<void> | void,
 down: () => Promise<void> | void,
 isUp: () => boolean
 } } Exot */

/** @type { (opt?: { idPrefix?: string, id?: string, onUp?: Exot['up'], onDown?: Exot['down'] }) => Exot } */
const createDummyExot = ({ // most Exot create func should be just sync, and move async things to up()
  // ## other option to config this Exot
  idPrefix = 'DUMMY-EXOT-',
  // ## pattern
  id = getRandomId62S(idPrefix), // unique string id, or specific name like "server-HTTP"
  onUp, onDown, ...extra // for fast convert some IO to Exot
} = {}) => {
  let isActive = false

  const up = async ( // NOTE: can also be sync, outer func better use await for both
    // ## pattern (the ONLY option, so Exot config can't suddenly change, and make pattern simple)
    onExotError // (error) => {} // can be OPTIONAL, mostly for ACK error outside of Exot function call, non-expert outside code should handle by `down` the Exot
  ) => {
    if (isActive) throw new Error('already up')
    if (!onExotError) throw new Error('expect onExotError to receive ExotError notice') // add assert if no OPTIONAL
    onUp && await onUp(onExotError) // { do work }
    isActive = true // late set (call up again during up should be a bug, a check here is optional, but not required)
  }

  const down = async () => { // NO throw/reject, should confidently release external resource, and allow call when down (do nothing) // NOTE: can also be sync, outer func better use await for both
    if (!isActive) return // skip
    isActive = false // early set (since this should not throw)
    onDown && await onDown() // { do work }
  }

  // NOTE: not extend state to `up.../up/down.../down` to keep the pattern simple, and when lifecycle code is separated and in one place, prevent double calling is easier
  const isUp = () => isActive // should return `true` on the last line of `up`, and `false` the first line of `down`

  return {
    ...extra,
    // ## pattern
    id, up, down, isUp
  }
}

/** @typedef { Exot & {
 upEach: Exot['up'], upBatch: Exot['up'],
 downEach: Exot['down'], downBatch: Exot['down'],
 getSize: () => number, set: (exot: Exot) => void, get: (exotId: string) => Exot | undefined, delete: (exotId: string) => Exot | undefined,
 load: (exot: Exot, onExotError: OnExotError) => Promise<void>, drop: (exotId: string) => Promise<Exot>,
 exotMap: ExotMap
 } } ExotGroup */

/** @type { (opt: {
 idPrefix?: string, id?: string,
 getOnExotError?: (exotGroup: ExotGroup) => OnExotError, onExotError?: OnExotError,
 exotList?: Exot[], exotMap?: ExotMap,
 isBatch?: boolean
 }) => ExotGroup } */
const createExotGroup = ({
  // ## other option to config this Exot
  idPrefix = 'EXOT-GROUP-',
  // ## pattern
  id = getRandomId62S(idPrefix), // unique string id, or specific name like "server-HTTP"
  getOnExotError, onExotError,
  exotList = [], exotMap = toExotMap(...exotList),
  isBatch = false
} = {}) => {
  // check isUp to prevent re-up error
  const upEach = async (onExotError = onExotErrorGroup) => { for (const exot of exotMap.values()) exot.isUp() || await exot.up(onExotError) }
  const upBatch = async (onExotError = onExotErrorGroup) => { await Promise.all(mapExotMapValue(exotMap, (exot) => exot.isUp() || exot.up(onExotError))) }

  // down in reverse order, so exot dependency do not tangle
  const downEach = async () => { for (const exot of Array.from(exotMap.values()).reverse()) await exot.down() }
  const downBatch = async () => { await Promise.all(Array.from(exotMap.values()).reverse().map((exot) => exot.down())) }

  const getSize = () => exotMap.size

  const set = (exot) => {
    if (!isExot(exot)) throw new Error(`invalid exot: ${exot}`)
    if (exotMap.has(exot.id)) throw new Error(`duplicate exot id: ${exot.id}`)
    exotMap.set(exot.id, exot)
  }
  const get = (exotId) => exotMap.get(exotId)
  const deleteKeyword = (exotId) => {
    const exot = get(exotId)
    exot !== undefined && exotMap.delete(exotId)
    return exot
  }

  const load = async (exot, onExotError = onExotErrorGroup) => {
    set(exot)
    exot.isUp() || await exot.up(onExotError)
  }
  const drop = async (exotId) => {
    const exot = deleteKeyword(exotId)
    exot && await exot.down()
    return exot
  }

  const up = isBatch ? upBatch : upEach
  const down = isBatch ? downBatch : downEach
  const isUp = () => findExotMapValue(exotMap, (exot) => exot.isUp()) // check if all Exot is up

  const exotGroup = {
    id, up, down, isUp,
    upEach, upBatch,
    downEach, downBatch,
    getSize, set, get, delete: deleteKeyword, // for preparing the group
    load, drop, // for hot swap when the group is up
    exotMap // NOTE: expose this for looping and more direct access
  }

  const onExotErrorGroup = onExotError ||
    (getOnExotError && getOnExotError(exotGroup)) ||
    down // default to down all Exot

  return exotGroup
}

/** @type { (value: unknown) => value is Exot } */
const isExot = (value) => isObjectAlike(value) &&
  isString(value.id) &&
  isBasicFunction(value.up) &&
  isBasicFunction(value.down) &&
  isBasicFunction(value.isUp)

/** @typedef { Map<string, Exot> } ExotMap */
/** @type { (...exotList: Exot[]) => ExotMap } */
const toExotMap = (...exotList) => {
  /** @type { ExotMap } */
  const exotMap = new Map()
  for (const exot of exotList) exotMap.set(exot.id, exot)
  return exotMap
}

/** @type { <T> (exotMap: ExotMap, func: (Exot) => T) => T[] } */
const mapExotMapValue = (exotMap, func) => {
  const resultList = []
  for (const exot of exotMap.values()) resultList.push(func(exot))
  return resultList
}

/** @type { <T> (exotMap: ExotMap, func: (Exot) => T) => T | undefined } */
const findExotMapValue = (exotMap, func) => {
  for (const exot of exotMap.values()) {
    const result = func(exot)
    if (result) return result
  }
}

export {
  createExotError,
  createDummyExot,
  createExotGroup,

  isExot,
  toExotMap, mapExotMapValue, findExotMapValue
}
