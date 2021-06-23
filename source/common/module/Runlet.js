import { createMapMap } from 'source/common/data/MapMap.js'

// Runlet is a Stream with less code and clearer execution order.
//
// Runlet contain Pools and Chips:
// - Pool provide the place to hold value, divided as Pends
// - Chip define the process func and the path of value
//
// By design, only the Runlet need to maintain the flow to be active/auto,
//   so the Pool & Chip code can be passive and minimal,
//   and easier for user to write custom ones.
// The config/declarative code style is used,
//   since most time there's no need to alter the flow after Runlet is built,
//   and this can make planning more complex flow graph easier.
// The execution order is optimised to allow more repeat of the same process,
//   with the help of Pool buffering, hoping the CPU cache hit chance can be higher.
// The pattern aim to make the flow state as transparent as possible,
//   so the user can predict the state whether the flow is running, end, or error,
//   while keep each part's job clear cut and hard to mix-up.

// hint:
//   Special symbol used to signal Chip and Pool how the flow should change,
//     send along with value in pack
// TODO: add DELIMITER/ENDL for packet boundary support?
const END = Symbol('runlet:hint:end') // for Chip receive/return, without value, meaning returning chip will not process/output more value (NOTE: to support split flow, allow return Number as value to pushPend extra END, the Number value is cleared before send down)
const SKIP = Symbol('runlet:hint:skip') // for Chip receive/return, without value, meaning chip want more input for an output (ratio N:1)
const REDO = Symbol('runlet:hint:redo') // for Chip return only, with value, meaning chip will output more for same input (ratio 1:N) (NOTE: do not pack reuse with REDO, and the pack will stay in runningChipMap when REDO)

const LOUD_FUNC = (error) => {
  console.error(error)
  throw error
}

// pack:
//   Simple array hold max 3 values, all may be `undefined`:
//   - `pack[ 0 ]`: the value, the data to send downstream
//   - `pack[ 1 ]`: hint, to signal flow change
//   - `pack[ 2 ]`: a promise, when the Chip process is running
//   The pack passing between Pend & Chip is always visible:
//   - most pack should be in one of the Pends
//   - a running Chip will hold a single pack
const createPack = (value, hint) => [ value, hint, undefined /* promise */ ] // at `pack[ 2 ]` holds the promise of the running Chip process
const clearPack = (pack) => { // prepare pack for reuse/pass-down // NOTE: only the END hint can and must pass through Pend
  const [ , hint ] = pack
  if (hint === END) pack[ 0 ] = undefined // clear extraEND value
  if (hint === REDO) pack[ 1 ] = undefined // clear REDO
  pack[ 2 ] = undefined // clear promise
  return pack
}
const describePack = (pack) => pack ? `${pack[ 0 ] && JSON.stringify(String(pack[ 0 ]).slice(0, 16))}|${String(pack[ 1 ] || '-')}|${pack[ 2 ] ? 'RUN' : 'IDLE'}` : ''

// Runlet:
//   Only do bare minimum work, no extra check,
//     and this is a general purpose non-optimal implementation.
//   Do not provide END callback, user need to get that from Output Chip,
//     this is for supporting Runlet with multi Output Chip, where multi END will be in flight.
//   Final outcome should be either END or error, and `error.isAbort = true` is recommended for abort.
//   No auto-close for Pool/Chip with external IO, and need manual init/clear outside Runlet.
// TODO: support Runlet reuse, even after detach?
// TODO: for use case like server response file stream, with conditional gzip Chip, can a simple declarative setup support this well?
const createRunlet = ({
  poolMap = new Map(),
  chipMap = new Map(),
  endChipKeySet = new Set(), // mark Chip received END hint
  runningChipMap = new Map(), // chipKey: pack
  onError = LOUD_FUNC // normal error should handled in Chip, this is mostly for Bug reporting, should just report & crash
}) => {
  const triggerChipFuncMap = new Map() // chipKey: triggerChipFunc
  const onPendPackMapMap = createMapMap() // (poolKey, pendKey): { onPendPush, onPendPull }

  const devStat = __DEV__ ? { triggerHitCount: 0, triggerStatMissCount: 0, triggerPushMissCount: 0, triggerPullMissCount: 0 } : undefined

  let isPause = false
  let isValid = true // marker to cut value passing after runlet error or detach

  // for wake queue
  const pushWakeKeySetMapMap = createMapMap() // (poolKey, pendKey): chipKeySet // wake up when push to pend
  const pullWakeKeySetMap = new Map() // (poolKey): chipKeySet // wake up when pull from pend

  const wakeKeyFastList = [] // chipKey, unique and ordered, for self/pushWake // TODO: currently almost no duplication happen, since the chip always clear previous wake then set a new one
  const wakeKeySlowList = [] // for pullWake, and will wake at a lower priority
  let isWakeLoopRunning = false // to flatten nested callstack
  const wakeLoop = () => {
    if (isWakeLoopRunning === true || (wakeKeyFastList.length === 0 && wakeKeySlowList.length === 0)) return
    isWakeLoopRunning = true
    let chipKey
    while ((chipKey = wakeKeyFastList.shift() || wakeKeySlowList.shift()) !== undefined) triggerChipFuncMap.get(chipKey)()
    isWakeLoopRunning = false
  }
  const queueChipResolveWake = (chipKey, pushWakeKeySet, pullWakeKeySet) => {
    if (chipKey !== undefined) wakeKeyFastList.unshift(chipKey) // this allow the Chip REDO get another trigger immediately
    if (pushWakeKeySet !== undefined) {
      for (const chipKey of pushWakeKeySet) wakeKeyFastList.push(chipKey)
      pushWakeKeySet.clear()
    }
    if (pullWakeKeySet !== undefined) { // TODO: can add skip check if pool is full, but now we need pullWakeKeySet to tell which pool to check
      for (const chipKey of pullWakeKeySet) wakeKeySlowList.push(chipKey)
      pullWakeKeySet.clear()
    }
    wakeLoop()
  }

  const onChipResolveUnbind = (
    chip, prevPool, nextPool, nextPushWakeKeySet, prevPullWakeKeySet, // NEED BIND
    { pack, state }
  ) => {
    if (isValid === false) return // NOTE: detached, no further state change, get the running result from runningChipMap pack promise if needed

    const [ value, hint ] = pack
    if (hint !== SKIP) { // update state & push next value
      hint === END && endChipKeySet.add(chip.key)
      nextPool.pushPend(chip.nextPendKey, clearPack(pack))
      if (hint === END && value >= 2) {
        let extraEND = value - 1 // already have one above
        while ((extraEND -= 1) >= 0) nextPool.pushPend(chip.nextPendKey, createPack(undefined, END)) // NOTE: to support split flow, allow return Number as value to pushPend extra END
      }
      if (__DEV__ && hint === REDO && runningChipMap.get(chip.key) === pack) throw new Error('do not reuse pack with REDO') // NOTE: if pack reuse + REDO, the same input pack will be reused as many output pack
      hint === REDO && clearPack(runningChipMap.get(chip.key)) // NOTE: reuse this for REDO
    }
    hint !== REDO && runningChipMap.delete(chip.key) // NOTE: reuse this for REDO
    chip.state = state
    if (isPause) return

    // `wake-up strategy`, the chip stuck will add it's key/trigger to nearby chip's wake list
    if (hint === END) queueChipResolveWake(undefined, nextPushWakeKeySet, prevPullWakeKeySet) // wake downstream
    else if (hint === REDO) queueChipResolveWake(chip.key, nextPushWakeKeySet, undefined) // wake self & downstream
    else if (hint === SKIP) queueChipResolveWake(chip.key, undefined, prevPullWakeKeySet) // wake self & upstream
    else queueChipResolveWake(chip.key, nextPushWakeKeySet, prevPullWakeKeySet) // passing value, trigger all related
  }

  const onChipRejectUnbind = (
    chipErrored, // NEED BIND
    error
  ) => {
    if (isValid === false) return onError(error) // not the first error, or error after manual detach
    isValid = false // mark all chip detached
    for (const chip of chipMap.values()) { // send runningPack + error to each chip
      if (endChipKeySet.has(chip.key)) continue
      endChipKeySet.add(chip.key)
      const pack = (chip === chipErrored) ? undefined : runningChipMap.get(chip.key)
      if (!chip.sync) chip.process(pack, chip.state, error).catch(onError) // NOTE: the error handle code in process should be sync (at the top of the async code, and before all await), and it's ok for most Chip to just return
      else { try { chip.process(pack, chip.state, error) } catch (error) { onError(error) } } // to close after current running process, just use code like `pack && pack[ 2 ].then(...)`
    }
  }

  const obtainChipPackUnbind = (chip, prevPool, nextPool, prevPushWakeKeySet, nextPullWakeKeySet) => {
    let pack = runningChipMap.get(chip.key) // for running async or REDO, a pack may be in runningChipMap already
    if (
      isPause ||
      endChipKeySet.has(chip.key) || // already get END hint
      (pack !== undefined && pack[ 2 ] !== undefined) // already running, just wait for self re-trigger
    ) {
      if (__DEV__) devStat.triggerStatMissCount++
      return
    }
    if (pack === undefined) { // pull from Pend to runningChipMap if no pack
      if ((pack = prevPool.pullPend(chip.prevPendKey)) !== undefined) runningChipMap.set(chip.key, pack)
      else { // no value to run
        prevPushWakeKeySet.add(chip.key) // wait upstream to wake
        if (__DEV__) devStat.triggerPullMissCount++
        return
      }
    }
    if (__DEV__ && pack[ 2 ]) throw new Error('pack should not have promise')
    if (nextPool.isPendLimited(chip.nextPendKey)) {
      nextPullWakeKeySet.add(chip.key) // wait downstream to wake
      if (__DEV__) devStat.triggerPushMissCount++
      return
    }
    if (__DEV__) devStat.triggerHitCount++
    return pack
  }

  const triggerAsyncChipUnbind = (
    chip, obtainChipPack, onChipResolve, onChipReject // NEED BIND
  ) => {
    const pack = obtainChipPack()
    if (pack === undefined) return
    const processPromise = chip.process(pack, chip.state, undefined)
    processPromise.then(onChipResolve, onChipReject)
    pack[ 2 ] = processPromise
  }
  const triggerSyncChipUnbind = (
    chip, obtainChipPack, onChipResolve, onChipReject // NEED BIND
  ) => {
    const pack = obtainChipPack()
    if (pack === undefined) return
    try { // skip setting `pack[ 2 ] = processPromise` since it's sync
      onChipResolve(chip.process(pack, chip.state, undefined))
    } catch (error) { onChipReject(error) }
  }

  const attach = () => { // TODO: maybe it's ok to alter the poolMap/chipMap and use this to hot re-link the Runlet
    triggerChipFuncMap.clear()
    onPendPackMapMap.clear()
    pushWakeKeySetMapMap.clear()
    pullWakeKeySetMap.clear()

    for (const pool of poolMap.values()) {
      pullWakeKeySetMap.set(pool.key, new Set())
      if (!pool.pendKeyGroupMap) continue
      for (const pendKeyGroupSet of pool.pendKeyGroupMap.values()) { // setup shared wakeKeySet for LogicalPool
        const sharedWakeKeySet = new Set()
        for (const pendKey of pendKeyGroupSet) pushWakeKeySetMapMap.set(pool.key, pendKey, sharedWakeKeySet)
      }
    }

    for (const chip of chipMap.values()) {
      const { key, prevPoolKey, prevPendKey, nextPoolKey, nextPendKey } = chip
      const prevPool = poolMap.get(prevPoolKey)
      const nextPool = poolMap.get(nextPoolKey)
      if (!prevPool) throw new Error(`missing prevPool: ${prevPendKey}`)
      if (!nextPool) throw new Error(`missing nextPool: ${nextPoolKey}`)

      const prevPushWakeKeySet = pushWakeKeySetMapMap.getSet(prevPoolKey, prevPendKey, () => new Set())
      const nextPushWakeKeySet = pushWakeKeySetMapMap.getSet(nextPoolKey, nextPendKey, () => new Set())
      const prevPullWakeKeySet = pullWakeKeySetMap.get(prevPoolKey)
      const nextPullWakeKeySet = pullWakeKeySetMap.get(nextPoolKey)

      const obtainChipPack = obtainChipPackUnbind.bind(null, chip, prevPool, nextPool, prevPushWakeKeySet, nextPullWakeKeySet)
      const onChipResolve = onChipResolveUnbind.bind(null, chip, prevPool, nextPool, nextPushWakeKeySet, prevPullWakeKeySet)
      const onChipReject = onChipRejectUnbind.bind(null, chip)
      const triggerChip = (chip.sync ? triggerSyncChipUnbind : triggerAsyncChipUnbind).bind(null, chip, obtainChipPack, onChipResolve, onChipReject)
      triggerChipFuncMap.set(key, triggerChip)
    }
  }

  const detach = () => { // TODO: clear up more thoroughly, so no value can be changed by later mis-operation
    isValid = false // mark all chip detached
    return { poolMap, chipMap, endChipKeySet, runningChipMap }
  }

  const trigger = () => triggerChipKeyList(chipMap.keys())
  const triggerChipKeyList = (chipKeyList) => {
    for (const chipKey of chipKeyList) wakeKeySlowList.push(chipKey)
    wakeLoop()
  }

  const onPendPullUnbind = (
    pullWakeKeySet // NEED BIND
  ) => {
    if (isPause) return
    queueChipResolveWake(undefined, undefined, pullWakeKeySet)
  }
  const onPendPushUnbind = (
    pushWakeKeySet // NEED BIND
  ) => {
    if (isPause) return
    queueChipResolveWake(undefined, pushWakeKeySet, undefined)
  }
  const getOnPendPack = (poolKey, pendKey) => {
    let onPendPack = onPendPackMapMap.get(poolKey, pendKey)
    if (onPendPack === undefined) {
      const onPendPush = onPendPushUnbind.bind(null, pushWakeKeySetMapMap.get(poolKey, pendKey))
      const onPendPull = onPendPullUnbind.bind(null, pullWakeKeySetMap.get(poolKey))
      onPendPackMapMap.set(poolKey, pendKey, (onPendPack = { onPendPull, onPendPush }))
    }
    return onPendPack
  }

  const createPendInput = (poolKey, pendKey) => {
    const { onPendPush } = getOnPendPack(poolKey, pendKey)
    const pool = poolMap.get(poolKey)
    return {
      pool,
      push: (pack) => { // may push END, but should not need SKIP
        pool.pushPend(pendKey, pack)
        onPendPush()
        return pack
      },
      canPush: () => !pool.isPendLimited(pendKey)
    }
  }
  const createPendOutput = (poolKey, pendKey) => { // TODO: pull value out on non-IO Pend may stop the auto re-trigger, and dead-lock the flow
    const { onPendPull } = getOnPendPack(poolKey, pendKey)
    const pool = poolMap.get(poolKey)

    return {
      pool,
      pull: () => { // this do not wait for value to come
        const pack = pool.pullPend(pendKey)
        onPendPull()
        return pack // may get END, for the passive ending Pend, no promise should exist since no Chip will run after
      },
      canPull: () => Boolean(pool.getPendSize(pendKey))
    }
  }

  const describe = (stringList = []) => {
    isValid || stringList.push('[DETACHED]')
    __DEV__ && stringList.push(`[__DEV__] devStat.triggerHitRate: ${(devStat.triggerHitCount / (devStat.triggerHitCount + devStat.triggerStatMissCount + devStat.triggerPushMissCount + devStat.triggerPullMissCount)).toFixed(4)}`)
    __DEV__ && stringList.push(`[__DEV__] devStat.triggerHitCount: ${devStat.triggerHitCount}`)
    __DEV__ && stringList.push(`[__DEV__] devStat.triggerStatMissCount: ${devStat.triggerStatMissCount}`)
    __DEV__ && stringList.push(`[__DEV__] devStat.triggerPushMissCount: ${devStat.triggerPushMissCount}`)
    __DEV__ && stringList.push(`[__DEV__] devStat.triggerPullMissCount: ${devStat.triggerPullMissCount}`)
    for (const chip of chipMap.values()) {
      stringList.push([
        `#${chip.key}`,
        `[${endChipKeySet.has(chip.key) ? 'END' : describePack(runningChipMap.get(chip.key))}]`,
        `${String(chip.prevPendKey)}@${String(chip.prevPoolKey)} >> ${String(chip.nextPendKey)}@${String(chip.nextPoolKey)}`,
        chip.describe && chip.describe()
      ].filter(Boolean).join(' '))
    }
    for (const pool of poolMap.values()) {
      stringList = pool.describe(stringList,
        (poolKey) => `pullWake[${[ ...pullWakeKeySetMap.get(poolKey) ]}]`,
        (poolKey, pendKey) => `pushWake[${[ ...(pushWakeKeySetMapMap.get(poolKey, pendKey) || [ 'EXTERNAL' ]) ]}]` // allow shared pool
      )
    }
    return stringList
  }

  return {
    poolMap,
    chipMap,

    getIsValid: () => isValid,

    getIsPause: () => isPause,
    setIsPause: (value) => { isPause = value },
    pause: () => { isPause = true }, // set pause flag to stop value passing/processing, will not stop running process
    resume: () => { isPause = false }, // unset pause flag, may need trigger() or push some value in to restore the flow

    attach, // call this at lease once before start the flow, and after Pool/Chip change
    detach, // cut off all data flow, return Pool Chip and running chip process // NOTE: this is not recoverable
    trigger, // trigger all runnable Chip: give a SKIP to signal InputChip, or passing value to Chip with prevPend

    // allow push/pull value to/from Pool Pend // NOTE: this is polling-based for sync peek/poke, for callback-based just add a Chip
    createPendInput,
    createPendOutput,

    describe
  }
}
// const createLinearRunlet = () => {} // optimise for linear flow, drop unnecessary check for faster speed

// Pool:
//   The default Pool should use the key `default`,
//     and there's a special IO Pool with Pend for Input/Output Chip.
//   This pattern should support basic array implementation,
//     as well as advanced no-alloc buffer with custom Runlet code.
const createCountPool = ({ // TODO: for fast zero-copy buffer, should let Pool & Chip acquire Buffer from an optimized SharedBufferPool
  key = 'default', // String || Symbol
  sizeLimit: poolSizeLimit // Number
}) => {
  let poolSize = 0 // sum of all pend, size can be count or byte, sizePrivate is always counted
  const pendMap = new Map() // pendKey: { packQueue: [], size, sizePrivate, sizeLimit }
  const devStat = __DEV__ ? { poolSizeHighest: 0 } : undefined

  return {
    key,
    pendKeyGroupMap: undefined, // new Map() // groupTag: pendKeyGroupSet // not used here, for marking group of Pend act together as one Pend, so the wakeKeySet is shared
    reset: () => {
      poolSize = 0
      pendMap.clear() // need to redo all configPend
      if (__DEV__) devStat.poolSizeHighest = 0
    },
    getPoolSize: () => poolSize,
    configPend: (pendKey, sizePrivate = 0, sizeLimit = Infinity) => { // assign Pend exclusive size // NOTE: will reset existing pend, and must config before use
      if (pendMap.has(pendKey)) poolSize -= pendMap.get(pendKey).sizePrivate
      pendMap.set(pendKey, { packQueue: [], size: 0, sizePrivate, sizeLimit })
      poolSize += sizePrivate
      if (__DEV__) devStat.poolSizeHighest = Math.max(devStat.poolSizeHighest, poolSize)
    },
    // below assume all related `configPend` is called
    isPendLimited: (pendKey) => { // no space in Pool, and have some pack in Pend, this can prevent full Pool cause upstream stall and dead-lock flow
      const { size, sizePrivate, sizeLimit } = pendMap.get(pendKey)
      return (size > sizePrivate) && // allow sizePrivate to bust sizeLimit (also must have at lease 1 value)
        (poolSize >= poolSizeLimit || (size >= sizeLimit)) // check if both limit busted
    },
    getPendSize: (pendKey) => pendMap.get(pendKey).size,
    pushPend: (pendKey, pack) => {
      if (__DEV__ && pack[ 1 ] === REDO) throw new Error(`wrong ${describePack(pack)}`)
      if (__DEV__ && pack[ 2 ]) throw new Error('pack should not have promise')
      const pend = pendMap.get(pendKey)
      pend.packQueue.push(pack)
      pend.size++
      if (pend.size > pend.sizePrivate) poolSize++
      if (__DEV__) devStat.poolSizeHighest = Math.max(devStat.poolSizeHighest, poolSize)
    },
    pullPend: (pendKey) => {
      const pend = pendMap.get(pendKey)
      if (pend.packQueue.length === 0) return
      if (pend.size > pend.sizePrivate) poolSize--
      pend.size--
      return pend.packQueue.shift()
    },
    describe: (stringList = [], getPoolExtraInfo, getPendExtraInfo) => {
      stringList.push(`@${String(key)} ${poolSize}/${poolSizeLimit} ${getPoolExtraInfo(key)}`)
      __DEV__ && stringList.push(`[__DEV__] devStat.poolSizeHighest: ${devStat.poolSizeHighest}`)
      for (const [ pendKey, { packQueue, size, sizePrivate } ] of pendMap) {
        stringList.push(` -${String(pendKey)} ${size},${sizePrivate}P [${packQueue.map(describePack).join(', ')}] ${getPendExtraInfo(key, pendKey)}`)
      }
      return stringList
    }
  }
}
// TODO: add a array-less single pack Pend Pool for faster passing speed?

// PoolIO:
//   A special static Pool for I/O Chip to use, only output SKIP, and error on other operation
const KEY_POOL_IO = Symbol('runlet:pool:io') // for Input/Output Chip's prevPoolKey/nextPoolKey
const KEY_PEND_INPUT = Symbol('runlet:pend:input') // for Input Chip's prevPendKey
const KEY_PEND_OUTPUT = Symbol('runlet:pend:output') // for Output Chip's nextPendKey
const PoolIO = {
  key: KEY_POOL_IO,
  pendKeyGroupMap: undefined,
  reset: () => {},
  getPoolSize: () => 0,
  configPend: (pendKey, sizePrivate = 0) => {
    if (pendKey !== KEY_PEND_INPUT && pendKey !== KEY_PEND_OUTPUT) throw new Error(`invalid IO config pendKey: ${String(pendKey)}`)
    if (sizePrivate) throw new Error(`invalid IO config sizePrivate: ${sizePrivate} for pendKey: ${String(pendKey)}`)
  },
  isPendLimited: (pendKey) => pendKey !== KEY_PEND_OUTPUT, // only allow output
  getPendSize: (pendKey) => pendKey === KEY_PEND_INPUT ? 1 : 0,
  pushPend: (pendKey, value) => {
    if (pendKey === KEY_PEND_OUTPUT && value[ 1 ] === END) return
    throw new Error(`invalid IO push pendKey: ${String(pendKey)}, value: ${String(value)}`)
  },
  pullPend: (pendKey) => {
    if (pendKey === KEY_PEND_INPUT) return createPack(undefined, SKIP) // NOTE: must be new pack since downstream may keep reuse the pack
    else throw new Error(`invalid IO shift pendKey: ${String(pendKey)}`)
  },
  describe: (stringList = [], getPoolExtraInfo, getPendExtraInfo) => {
    stringList.push(`@${String(KEY_POOL_IO)}`)
    return stringList
  }
}

// LogicalPool:
//   Only PendView/PendViewee is allowed in this Pool,
//     and all operation here should be either towards PendView or PendViewee,
//     put normal Pend in separate Pool or pass it in as innerPool.
// PendView/PendViewee:
//   A PendView can pull/push pack from/to multiple Pend(PendViewee),
//     but PendView do not keep the pack itself, all info gets calc passively when needed,
//     and all logic must be sync, though cache/memorize is recommended.
//   A PendViewee is a normal Pend,
//     but can notice the PendView their change if needed.
//   This make 1toN or Nto1 junction possible and reasonably simple,
//     and all Chip only need to deal with simple 1to1 process.
// NOTE:
//   For process like 1C=1A+3B, remember to set enough sizePrivate, so enough B can exist in Pend.
const TYPE_LOGICAL_PENDVIEW = Symbol('runlet:pend:logical:pendview')
const TYPE_LOGICAL_PENDVIEWEE = Symbol('runlet:pend:logical:pendviewee')
__DEV__ && console.log({
  samplePendLogicPendView: {
    type: TYPE_LOGICAL_PENDVIEW, state: {}, pendVieweeKeyList: [ 'pendviewee:0', 'pendviewee:1', 'pendviewee:2' ], describe: () => 'some info',
    isPendLimitedUnbind: () => {}, getPendSizeUnbind: () => {}, pushPendUnbind: () => {}, pullPendUnbind: () => {} // all required, but will provide extra args: innerPool, pendLogicalMap, pendLogic
    // isPendLimited: () => {}, getPendSize: () => {}, pushPend: () => {}, pullPend: () => {} // will be generated
  },
  samplePendLogicPendViewee: {
    type: TYPE_LOGICAL_PENDVIEWEE, state: {},
    isPendLimitedUnbind: () => {}, getPendSizeUnbind: () => {}, pushPendUnbind: () => {}, pullPendUnbind: () => {} // all optional
    // isPendLimited: () => {}, getPendSize: () => {}, pushPend: () => {}, pullPend: () => {} // may be generated, or fallback to innerPool func
  }
})
const createLogicalCountPool = ({ // allow added logic to bind multiple pend as fork/dup/merge, but the added check code will run slower than simple Pool
  key = 'default-logical',
  sizeLimit: poolSizeLimit,
  innerPool = createCountPool({ key, sizeLimit: poolSizeLimit }) // holds all PendViewee, but no PendView since it hold no value
}) => {
  const pendKeyGroupMap = new Map()
  const pendLogicalMap = new Map()
  const configPendLogic = (pendKey, pendLogic) => {
    if (pendLogic.isPendLimitedUnbind) pendLogic.isPendLimited = pendLogic.isPendLimitedUnbind.bind(null, innerPool, pendLogicalMap, pendLogic)
    if (pendLogic.getPendSizeUnbind) pendLogic.getPendSize = pendLogic.getPendSizeUnbind.bind(null, innerPool, pendLogicalMap, pendLogic)
    if (pendLogic.pushPendUnbind) pendLogic.pushPend = pendLogic.pushPendUnbind.bind(null, innerPool, pendLogicalMap, pendLogic)
    if (pendLogic.pullPendUnbind) pendLogic.pullPend = pendLogic.pullPendUnbind.bind(null, innerPool, pendLogicalMap, pendLogic)
    if (pendLogic.type === TYPE_LOGICAL_PENDVIEW) { // check all func is provided
      if (!pendLogic.isPendLimited) throw new Error(`expect isPendLimited in pendLogic of: ${String(pendKey)}`)
      if (!pendLogic.getPendSize) throw new Error(`expect getPendSize in pendLogic of: ${String(pendKey)}`)
      if (!pendLogic.pushPend) throw new Error(`expect pushPend in pendLogic of: ${String(pendKey)}`)
      if (!pendLogic.pullPend) throw new Error(`expect pullPend in pendLogic of: ${String(pendKey)}`)
    } else { // for PendViewee, add fallback to innerPool func
      if (!pendLogic.isPendLimited) pendLogic.isPendLimited = innerPool.isPendLimited
      if (!pendLogic.getPendSize) pendLogic.getPendSize = innerPool.getPendSize
      if (!pendLogic.pushPend) pendLogic.pushPend = innerPool.pushPend
      if (!pendLogic.pullPend) pendLogic.pullPend = innerPool.pullPend
    }
  }

  return {
    ...innerPool,
    key, // for shared innerPool
    pendKeyGroupMap,
    reset: () => {
      innerPool.reset()
      pendKeyGroupMap.clear()
      pendLogicalMap.clear()
    },
    configPend: (pendKey, sizePrivate = 0, sizeLimit = Infinity, pendLogic) => { // assign Pend exclusive size // NOTE: will reset existing pend, and must config before use
      if (!pendLogic) throw new Error(`expect pendLogic for: ${String(pendKey)}`)
      if (pendLogic.type === TYPE_LOGICAL_PENDVIEW) {
        configPendLogic(pendKey, pendLogic)
        pendLogicalMap.set(pendKey, pendLogic)
        pendKeyGroupMap.set(pendKey, new Set([ pendKey, ...pendLogic.pendVieweeKeyList ]))
      } else if (pendLogic.type === TYPE_LOGICAL_PENDVIEWEE) {
        configPendLogic(pendKey, pendLogic)
        pendLogicalMap.set(pendKey, pendLogic)
        innerPool.configPend(pendKey, sizePrivate, sizeLimit)
      } else throw new Error(`invalid pendLogic for: ${String(pendKey)}`)
    },
    // below assume all related `configPend` is called, and will be slower for the added extra layer
    isPendLimited: (pendKey) => pendLogicalMap.get(pendKey).isPendLimited(pendKey),
    getPendSize: (pendKey) => pendLogicalMap.get(pendKey).getPendSize(pendKey),
    pushPend: (pendKey, pack) => pendLogicalMap.get(pendKey).pushPend(pendKey, pack),
    pullPend: (pendKey) => pendLogicalMap.get(pendKey).pullPend(pendKey),
    describe: (stringList = [], getPoolExtraInfo, getPendExtraInfo) => {
      const innerStringList = innerPool.describe([], getPoolExtraInfo, getPendExtraInfo)
      innerStringList[ 0 ] = `@${String(key)} INNER ${innerStringList[ 0 ]}` // mark inner Pool
      stringList.push(...innerStringList)
      for (const [ pendKey, pendLogic ] of pendLogicalMap) { // NOTE: add PendView describe at the end
        if (pendLogic.type !== TYPE_LOGICAL_PENDVIEW) continue
        stringList.push(` -${String(pendKey)} PENDVIEW ${getPendExtraInfo(key, pendKey)} ${pendLogic.describe ? pendLogic.describe() : ''}`)
      }
      return stringList
    }
  }
}

// Chip:
//   Should be as simple as possible, but also do not divide work too much,
//     since pack passing still has costs.
//   Added state to store side effect, so the process function can be pure function, conceptually.
//   For performance, the state is expected to be changed by direct mutate so less GC involved,
//     but it may be reasonable to go full immutable for some case.
//   Error from chip.process will detach the Runlet, and notify all Chip,
//     so most Chip should self-recover or send down error as pack value

// ChipSyncBasic:
//   A sample pass-though Chip of all supported config.
const ChipSyncBasic = { // NOTE: always duplicate this Chip when use, or the source Object maybe shared in Runlet causing bugs
  key: 'chip:sync-basic',
  prevPoolKey: undefined, prevPendKey: undefined, prevPendSizePrivate: 0, prevPendSizeLimit: Infinity, prevPendLogic: {}, // all after PendSize is optional
  nextPoolKey: undefined, nextPendKey: undefined, nextPendSizePrivate: 0, nextPendSizeLimit: Infinity, nextPendLogic: {}, // all after PendSize is optional
  state: null, // optional
  sync: true, // will get faster loop (no added await) but also lower wake hit rate (sync will lock execute order)
  process: (pack, state, error) => error ? undefined : { pack, state }, // pass through
  describe: () => 'CHIP-SYNC-BASIC' // optional
}

const toPoolMap = (poolList = []) => {
  const poolMap = new Map()
  for (const pool of poolList) {
    if (poolMap.has(pool.key)) throw new Error(`duplicated pool key: ${pool.key}`)
    poolMap.set(pool.key, pool)
  }
  return poolMap
}
const toChipMap = (chipList = []) => {
  const chipMap = new Map()
  for (const chip of chipList) {
    if (chipMap.has(chip.key)) throw new Error(`duplicated chip key: ${chip.key}`)
    chipMap.set(chip.key, chip)
  }
  return chipMap
}

// same pool with auto-increment pendKey
const toLinearChipList = (chipList, {
  poolKey = 'default',
  pendKeyBase = 'pend:',
  chipKeyBase = 'chip:',
  counter = 0
} = {}) => {
  for (const chip of chipList) {
    if (chip.prevPoolKey === undefined) chip.prevPoolKey = poolKey
    if (chip.prevPendKey === undefined) chip.prevPendKey = `${pendKeyBase}${counter}`
    counter++
    if (chip.key === undefined) chip.key = `${chipKeyBase}${counter}`
    if (chip.nextPoolKey === undefined) chip.nextPoolKey = poolKey
    if (chip.nextPendKey === undefined) chip.nextPendKey = `${pendKeyBase}${counter}`
  }
  return chipList
}

const quickConfigPend = (poolMap, chipMap, extraConfig) => {
  for (const chip of chipMap.values()) poolMap.get(chip.prevPoolKey).configPend(chip.prevPendKey, chip.prevPendSizePrivate, chip.prevPendSizeLimit, chip.prevPendLogic) // only for passive input Pend
  for (const chip of chipMap.values()) poolMap.get(chip.nextPoolKey).configPend(chip.nextPendKey, chip.nextPendSizePrivate, chip.nextPendSizeLimit, chip.nextPendLogic) // prefer config Pend with chip.next*
  return { ...extraConfig, poolMap, chipMap }
}

export {
  END, SKIP, REDO,
  createPack, clearPack, describePack,
  createRunlet,
  createCountPool,
  KEY_POOL_IO, KEY_PEND_INPUT, KEY_PEND_OUTPUT, PoolIO,
  TYPE_LOGICAL_PENDVIEW, TYPE_LOGICAL_PENDVIEWEE, createLogicalCountPool,
  ChipSyncBasic,
  toPoolMap, toChipMap, toLinearChipList, quickConfigPend
}

export { // TODO: DEPRECATE: import from RunletChip
  createArrayInputChip, createArrayOutputChip,
  createAsyncIteratorInputChip, createAsyncIteratorOutputChip,
  createENDRegulatorChip
} from './RunletChip.js'
