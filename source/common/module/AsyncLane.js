import { getSample } from 'source/common/math/sample'
import { createAsyncFuncQueue } from './AsyncFuncQueue'

// ## AsyncLane ##
//   list of AsyncQueue (here AsyncQueue = lane)
//   no specific lane select logic provided
//   only provide summary status, not query for each value
//   for load-balancing when using JS to trigger heavier external code, or implement a specific queue strategy
const createAsyncLane = ({
  laneSize, // the size can't be changed for now
  createAsyncQueue = createAsyncFuncQueue // allow swap AsyncQueue
}) => {
  // sanity check
  laneSize = Number(laneSize)
  if (!(laneSize >= 1)) throw new Error(`invalid laneSize: ${laneSize}`)

  // init data to [ { index, asyncQueue } ]
  const laneList = getSample((index) => ({ index, asyncQueue: createAsyncQueue() }), laneSize)

  const getStatus = (isVerbose) => laneList.map(({ index, asyncQueue }) => isVerbose
    ? { index, length: asyncQueue.getLength() }
    : asyncQueue.getLength()
  )

  const reset = () => laneList.forEach(({ asyncQueue }) => { asyncQueue.reset() })

  const push = (value, laneIndex) => {
    const lane = laneList[ laneIndex ]
    if (!lane) throw new Error(`invalid laneIndex: ${laneIndex}`)
    return lane.asyncQueue.push(value)
  }

  return {
    laneList, // for extend func, not recommend direct access
    getStatus, reset, push
  }
}

// ## sample extend ##
//   below is some idea to extend asyncLane
//   note this code is more for sample, and be compose-able
//   for max performance better single all-in-one enhance with targeted API

// ## AutoSelectLane extend ##
//   sample extend func for asyncLane
//   add auto lane select
//   note the select pattern can change like: `(laneList, value, ...args) => lane`
const extendAutoSelectLane = (
  asyncLane,
  selectLane = selectMinLoadLane // (laneList, value) => lane
) => {
  const { laneList } = asyncLane

  return {
    ...asyncLane,
    pushAuto: (value) => asyncLane.push(value, selectLane(laneList, value).index) // new
  }
}

const selectMinLoadLane = (laneList, value /* , ...args */) => laneList.reduce(
  (o, lane) => o.asyncQueue.getLength() > lane.asyncQueue.getLength() ? lane : o,
  laneList[ 0 ] // default to first lane
)

// ## ValueList extend ##
//   sample extend func for asyncLane
//   maintain the value in an extra list
// ## About lazy drop ##
//   since the valueList and asyncQueue are pushed at the same time
//   and valueList keep a newer first order
//   so to drop stale value from valueList, just clip the queue length to match asyncQueue
//   and since we expect more func will be pushed
//   the lazy clip can happen only after a new func is pushed
const extendLaneValueList = (asyncLane) => {
  const { laneList } = asyncLane

  // patch data to [ { index, asyncQueue, valueList } ]
  laneList.forEach((lane) => { lane.valueList = [] }) // newer first, length may be longer due to lazy trim, when some long running func get pushed at the same time

  const reset = () => {
    asyncLane.reset()
    laneList.forEach(({ valueList }) => { valueList.length = 0 })
  }

  const getStatus = (isVerbose) => {
    const status = asyncLane.getStatus(isVerbose)
    isVerbose && status.forEach((laneStatus) => { laneStatus.valueList = laneList[ laneStatus.index ].valueList })
    return status
  }

  const push = (value, laneIndex) => {
    const valuePromise = asyncLane.push(value, laneIndex)
    const { asyncQueue, valueList } = laneList[ laneIndex ]
    valueList.unshift(value)
    valueList.length = asyncQueue.getLength() // lazy stale value drop, happen on new value push
    return valuePromise
  }

  const trimValueList = () => laneList.forEach(({ asyncQueue, valueList }) => { // combine with setInterval for more frequent stale value trim, most time lazy drop should be enough
    valueList.length = asyncQueue.getLength()
  })

  return {
    ...asyncLane,
    getStatus, reset, push, // change
    trimValueList // new
  }
}

// ## ValueMap extend ##
//   sample extend func for asyncLane
//   maintain the value in an extra map
//   require the value to have id
//   require manual trim of valueMap
const extendLaneValueMap = (asyncLane) => {
  const { laneList } = asyncLane

  // patch data to [ { index, asyncQueue, valueMap } ]
  laneList.forEach((lane) => { lane.valueMap = new Map() }) // newer first, length may be longer due to lazy trim, when some long running func get pushed at the same time

  const reset = () => {
    asyncLane.reset()
    laneList.forEach(({ valueMap }) => { valueMap.clear() })
  }

  const getStatus = (isVerbose) => {
    const status = asyncLane.getStatus(isVerbose)
    isVerbose && status.forEach((laneStatus) => { laneStatus.valueList = [ ...laneList[ laneStatus.index ].valueMap.values() ] })
    return status
  }

  const push = (value, laneIndex) => {
    if (!value.id) throw new Error('expect value.id')
    const valuePromise = asyncLane.push(value, laneIndex)
    laneList[ laneIndex ].valueMap.set(value.id, value)
    // if (laneList[ laneIndex ].valueMap.has(value.id)) throw new Error(`duplicate value.id: ${value.id}`) // the check is too late, and can't prevent id duplicate cross lane
    return valuePromise
  }

  const trimValueMap = ( // combine with setInterval for more frequent stale value trim
    filterFunc // return true to keep
  ) => laneList.forEach(({ valueMap }) => valueMap.forEach((value, id) => filterFunc(value, id) || valueMap.delete(id)))

  const findValue = (id, laneIndex) => {
    const lane = laneList[ laneIndex ]
    return lane && lane.valueMap.get(id)
  }

  const dropValue = (id, laneIndex) => {
    const lane = laneList[ laneIndex ]
    return lane && lane.valueMap.delete(id)
  }

  return {
    ...asyncLane,
    getStatus, reset, push, // change
    trimValueMap, findValue, dropValue // new
  }
}

// ## custom extend ##
//   commonly used to load balance while keep same kind(tag) of work queue up in the same lane,
//   to avoid retry blocking and better change to hit cache
const extendAutoSelectByTagLane = (
  asyncLane,
  selectByTagLane = selectByTagOrMinLoadLane // (laneList, value, tag) => lane
) => {
  const { laneList } = asyncLane

  // patch data to [ { index, asyncQueue, tagList } ]
  laneList.forEach((lane) => { lane.tagList = [] }) // newer first, length may be longer due to lazy trim, when some long running func get pushed at the same time

  const reset = () => {
    asyncLane.reset()
    laneList.forEach(({ tagList }) => { tagList.length = 0 })
  }

  const getStatus = (isVerbose) => {
    const status = asyncLane.getStatus(isVerbose)
    isVerbose && status.forEach((laneStatus) => { laneStatus.tagList = laneList[ laneStatus.index ].tagList })
    return status
  }

  const push = (value, laneIndex, tag) => {
    const valuePromise = asyncLane.push(value, laneIndex)
    const { asyncQueue, tagList } = laneList[ laneIndex ]
    tagList.unshift(tag)
    tagList.length = asyncQueue.getLength() // lazy stale value drop, happen on new value push
    return valuePromise
  }

  return {
    ...asyncLane, reset, getStatus, push,
    pushAutoTag: (value, tag) => push(value, selectByTagLane(laneList, value, tag).index, tag) // new
  }
}

const selectByTagOrMinLoadLane = (laneList, value, tag) => (
  (tag && laneList.find((lane) => lane.tagList.includes(tag))) || // try put to lane with same tag, if tag is not falsy
  selectMinLoadLane(laneList) // try min-load
)

export {
  createAsyncLane,

  // sample extend func, also compose-able, not for top performance
  extendAutoSelectLane, selectMinLoadLane,
  extendLaneValueList,
  extendLaneValueMap,

  // custom extend
  extendAutoSelectByTagLane, selectByTagOrMinLoadLane
}
