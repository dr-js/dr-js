import { isString, isObjectAlike, isBasicFunction } from 'source/common/check'
import { getRandomId } from 'source/common/math/random'

// TODO: still under testing, pattern not stable
// Exot is short for "Exot-ic", a pattern for wrapping external IO or Resource that require manual `up` and `down`.

const createExotError = (exotId, message) => { // error with exotId
  const exotError = new Error(message)
  exotError.exotId = exotId
  return exotError
}

const createDummyExot = ({ // most Exot create func should be just sync, and move async things to up()
  // ## other option to config this Exot
  idPrefix = 'DUMMY-EXOT-',
  // ## pattern
  id = getRandomId(idPrefix) // unique string id, or specific name like "server-HTTP"
} = {}) => {
  let isActive = false

  const up = ( // NOTE: can also be sync, outer func better use await for both
    // ## pattern (the ONLY option, so Exot config can't suddenly change, and make pattern simple)
    onExotError // (error) => {} // can be OPTIONAL, mostly for ACK error outside of Exot function call, non-expert outside code should handle by `down` the Exot
  ) => {
    if (isActive) throw new Error('already up')
    if (!onExotError) throw new Error('expect onExotError to receive ExotError notice') // add assert if no OPTIONAL
    // { do work }
    isActive = true // late set (call up again during up should be a bug, a check here is optional, but not required)
  }

  const down = () => { // NO throw/reject, should confidently release external resource, and allow call when down (do nothing) // NOTE: can also be sync, outer func better use await for both
    if (!isActive) return // skip
    isActive = false // early set (since this should not throw)
    // { do work }
  }

  // NOTE: not extend state to `up.../up/down.../down` to keep the pattern simple, and when lifecycle code is separated and in one place, prevent double calling is easier
  const isUp = () => isActive // should return `true` on the last line of `up`, and `false` the first line of `down`

  return {
    // ## pattern
    id, up, down, isUp
  }
}

const createExotGroup = ({
  id,
  getOnExotError, onExotError,
  exotList = [], exotMap = toExotMap(exotList),
  isBatch = false
}) => {
  const upEach = async (onExotError = onExotErrorGroup) => {
    try { for (const exot of exotMap.values()) await exot.up(onExotError) } catch (error) {
      await onExotError()
      throw error
    }
  }
  const upBatch = async (onExotError = onExotErrorGroup) => {
    await Promise.all(mapExotMapValue(exotMap, (exot) => exot.up(onExotError))).catch(async (error) => {
      await onExotError()
      throw error
    })
  }

  // down in reverse order
  const downEach = async () => { for (const exot of Array.from(exotMap.values()).reverse()) await exot.down() }
  const downBatch = async () => { await Promise.all(Array.from(exotMap.values()).reverse().map((exot) => exot.down())) }

  const getSize = () => exotMap.size

  const set = (exot) => { exotMap.set(exot.id, exot) }
  const get = (exotId) => exotMap.get(exotId)
  const deleteKeyword = (exotId) => {
    const exot = get(exotId)
    exot !== undefined && exotMap.delete(exotId)
    return exot
  }

  const load = async (exot) => {
    set(exot)
    await exot.up(onExotError)
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
    load, drop // for hot swap when the group is up
  }

  const onExotErrorGroup = onExotError ||
    (getOnExotError && getOnExotError(exotGroup)) ||
    down // default to down all Exot

  return exotGroup
}

const isExot = (value) => isObjectAlike(value) &&
  isString(value.id) &&
  isBasicFunction(value.up) &&
  isBasicFunction(value.down) &&
  isBasicFunction(value.isUp)

const toExotMap = (...exotList) => {
  const exotMap = new Map()
  for (const exot of exotList) exotMap.set(exot.id, exot)
  return exotMap
}

const mapExotMapValue = (exotMap, func) => {
  const resultList = []
  for (const exot of exotMap.values()) resultList.push(func(exot))
  return resultList
}

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
