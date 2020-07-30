import { getGlobal } from 'source/env/global'
import { setTimeoutAsync } from 'source/common/time'
import { getRandomId } from 'source/common/math/random'

// TODO: still under testing, pattern not stable
// Exot is short for "Exot-ic", a pattern for wrapping external IO or Resource that require manual `up` and `down`.

const createExotError = (exotId, message) => { // error with exotId
  const exotError = new Error(message)
  exotError.exotId = exotId
  return exotError
}

const createSampleExot = ({
  // ## pattern
  id = getRandomId('SAMPLE-EXOT-'), // unique string id, or specific name like "server-HTTP"
  // ## other option to config this Exot
  sampleConfig = {}
}) => {
  let _onExotError
  let _isUp = false

  const up = async (
    // ## pattern (the ONLY option, so Exot config can't suddenly change, and make pattern simple)
    onExotError // (error) => {} // mostly for ACK error outside of Exot function call, non-expert outside code should handle by `down` the Exot
  ) => {
    if (_isUp) throw new Error('already up')
    if (!onExotError) throw new Error('expect onExotError to receive ExotError notice')
    await setTimeoutAsync(10) // pretend WORKING
    getGlobal()[ id ] = { id, sampleConfig }
    _onExotError = onExotError
    _isUp = true // late set (call up again during up should be a bug, a check here is optional, but not required)
  }

  const down = async () => { // NO throw/reject, should confidently release external resource, and allow call when down (do nothing)
    if (!_isUp) return // skip
    _onExotError = undefined
    _isUp = false // early set (since this should not throw)
    await setTimeoutAsync(10) // pretend WORKING
    delete getGlobal()[ id ]
  }

  // NOTE: not extend state to `up.../up/down.../down` to keep the pattern simple, and when lifecycle code is separated and in one place, prevent double calling is easier
  const isUp = () => _isUp // should return `true` on the last line of `up`, and `false` the first line of `down`

  // - async func should resolve on success, never-resolve on ExotError, reject on input Error (Bug):
  //   when Error caused Exot `down` during an in-flight async func, the callback is expected to be dropped if the result can not be generated
  const sampleAsync = async (input) => {
    if (!'pass|late-check-error|exot-error'.split('|').includes(input)) throw new Error(`invalid input ${input}`) // check input, no catch Error
    let result
    try {
      result = await setTimeoutAsync(0).then(() => input === 'exot-error'
        ? Promise.reject(createExotError(id, `ExotError: ${input}`)) // do Exot ASYNC operation and catch error
        : 'Job done'
      )
    } catch (error) { // do Exot operation and catch error
      if (!error.exotId) throw error // report non-ExotError
      // if there'll be left-over error listener after Exot `down`, add a guard to mute the error
      // but if by design no listener should leak, don't bother and mask the bug
      _onExotError && _onExotError(error) // report ExotError through onExotError
      return new Promise(() => {}) // make this operation never resolve
    }
    if (!result || input === 'late-check-error') throw new Error(`invalid result: ${result}, input: ${input}`) // check result, no catch Error (report operation timeout, wrong password, ...)
    return result
  }

  // - sync func just report all Error, since it can not prevent the later code to run,
  //   the Error can be thrown, or returned as `{ error, result }`,
  //   generally sync func will be harder to deal with for the mixed error
  const sampleSync = (input) => {
    if (!'pass|late-check-error|exot-error'.split('|').includes(input)) throw new Error(`invalid input ${input}`) // check input, no catch Error
    let result
    { // eslint-disable-line no-lone-blocks
      if (input === 'exot-error') throw createExotError(id, `ExotError: ${input}`) // do Exot SYNC operation and NOT catch error (but normally a ExotError will not be sync)
      result = 'Job done'
    }
    if (!result || input === 'late-check-error') throw new Error(`invalid result: ${result}, input: ${input}`) // check result, no catch Error
    return result
  }

  return {
    // ## pattern
    id, up, down, isUp,
    // ## other func for sync/async data exchange (IO)
    sampleAsync, sampleSync
  }
}

const createExotGroup = ({
  id,
  onExotError,
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
  const up = isBatch ? upBatch : upEach

  const downEach = async () => { for (const exot of exotMap.values()) await exot.down() }
  const downBatch = async () => { await Promise.all(mapExotMapValue(exotMap, (exot) => exot.down())) }
  const down = isBatch ? downBatch : downEach

  const onExotErrorGroup = onExotError || down

  const isUp = () => findExotMapValue(exotMap, (exot) => exot.isUp())
  const find = (exotId) => exotMap.get(exotId)
  const getSize = () => exotMap.size

  const attach = (exot) => { exotMap.set(exot.id, exot) }
  const detach = (exotId) => {
    const exot = find(exotId)
    exot !== undefined && exotMap.delete(exotId)
    return exot
  }

  const load = async (exot) => {
    attach(exot)
    await exot.up(onExotError)
  }
  const drop = async (exotId) => {
    const exot = detach(exotId)
    exot && await exot.down()
    return exot
  }

  return {
    id,
    up, upEach, upBatch,
    down, downEach, downBatch,
    isUp,
    find, getSize,
    attach, detach, // TODO: inner API?
    load, drop
  }
}

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
  createSampleExot,
  createExotGroup,

  toExotMap, mapExotMapValue, findExotMapValue
}
