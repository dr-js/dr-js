import { resolve, dirname } from 'node:path'

import { padTable, time, describe } from 'source/common/format.js'
import { isString, isBasicFunction } from 'source/common/check.js'
import { string, integer, basicObject, basicArray, basicFunction } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { createLoopIndex } from 'source/common/data/LoopIndex.js'

import { existPath } from 'source/node/fs/Path.js'
import { readText, readJSON, writeJSON, deleteFile } from 'source/node/fs/File.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { getContainerLsList, matchContainerLsList } from 'source/node/module/Software/docker.js'
import { getProcessListAsync, toProcessPidMap, toProcessTree, flattenProcessTree, isPidExist, killProcessInfoAsync } from 'source/node/system/Process.js'
import { run, runDetached } from 'source/node/run.js'

// =============================================================================
// loop config

// support watch detached process (unit) every 5 or 10 sec
// start missing units, and restart OOM units
const SAMPLE_PATTERN = 'string-to-match' || /regexp-to-match/ || { test: (v) => true }
const SAMPLE_COMMAND = { // one of
  argList: 'node -e process.version' || [ 'command', 'and', 'args', 'optionalPid for `run.resetSub`' ], // no shell, so add `bash -c` of needed
  logFile: 'path/to/redirect/stdout&stderr', // logFile only for 'run.start'
  cwd: 'path/to/run/command', env: {},
  wait: 256, // in msec, default wait for 256msec after run to prevent start many heavy process at once

  func: async (unitConfig, ...args) => {} // return pid or undefined // args should be [ optionalPid ] for `stop/reset/resetSub`
}
const SAMPLE_UNIT_CONFIG = {
  name: 'sample unit',
  clue: { // one of:
    pid: true, // DEFAULT will use the spawned pid + command to find the unit, not suitable for run & detached process where the bootstrap script will exit, or process which will change command/title
    pidFile: 'path/to/file.pid', pidFileKeepStale: false, // not suitable for unit in docker, default will remove stale pid file (no process exist with that pid)
    commandPattern: SAMPLE_PATTERN,
    containerImagePattern: SAMPLE_PATTERN, // DOCKER
    containerNamesPattern: SAMPLE_PATTERN // DOCKER
  },
  run: { // after formatting will be under `__run`
    isMajorUnit: false, // if set to true, will expect this unit to bring up/down other unit (for current loop, later loop will still try to start other missing units)
    start: SAMPLE_COMMAND,
    stop: SAMPLE_COMMAND, // DEFAULT to send SIGTERM to pid
    reset: SAMPLE_COMMAND, // DEFAULT to send SIGTERM to pid (and wait for later start), not restart, kill or send signal only
    resetSub: SAMPLE_COMMAND // DEFAULT to send SIGTERM to pid, will pass in optionalPid, fallback to reset
    // status: SAMPLE_COMMAND // should generate a one-line status for logging // default will be `name|pid|memTotal|age`
  },
  limit: { // any of
    memoryMaxTotalMiB: 0, // set to 0 to skip check, will use `run.reset` to reset (restart) main process
    memoryMaxSubProcessMiB: 0 // set to 0 to skip check, will use `run.resetSub` to kill the sub process, or fallback to `run.reset`
  }
  // event: { // TODO: any of
  //   onMissing: async (unitConfig, loopIndexList = []) => {},
  //   onLimit: async (unitConfig, limitKey = 'memoryMaxTotalMiB') => {}
  // }
}
__DEV__ && console.log({ SAMPLE_UNIT_CONFIG })

const formatPattern = (pattern) => {
  if (isString(pattern)) return (string) => string.includes(pattern)
  if (isBasicFunction(pattern.test)) return (string) => pattern.test(string)
  throw new Error(`invalid pattern: ${describe(pattern)}`)
}

const formatCommand = (command, formatPath, isDetached = false) => {
  if (command.argList) {
    let { argList, logFile, cwd, env, wait = 256 } = command
    if (isString(argList)) argList = argList.split(' ')
    basicArray(argList, `invalid command.argList: ${describe(argList)}`)
    logFile = logFile ? formatPath(logFile) : undefined
    cwd = cwd ? formatPath(cwd) : undefined
    env !== undefined && basicObject(env, `invalid command.env: ${describe(env)}`)
    integer(wait, `invalid command.wait: ${describe(wait)}`)
    return async (unitConfig, ...args) => {
      const runArgList = [ ...argList, ...args ]
      const option = {
        stdoutFile: isDetached ? logFile : undefined, // only for runDetached
        env: env && { ...process.env, ...env },
        cwd
      }
      __DEV__ && console.log('- - [runConfig|argList]', JSON.stringify({ isDetached, runArgList }))
      let pid
      if (isDetached) pid = runDetached(argList, option).subProcess.pid
      else {
        const { subProcess, promise } = run(argList, option)
        await promise.catch((error) => { __DEV__ && console.log(`[ERROR|runConfig] ${error}`) })
        pid = subProcess.pid
      }
      wait && await setTimeoutAsync(wait)
      return pid
    }
  } else if (command.func) {
    basicFunction(command.func, `invalid command.func: ${describe(command.func)}`)
    return command.func // async (unitConfig, ...args) => pid || undefined
  } else throw new Error(`invalid command: ${describe(command)}`)
}
const defaultCommandStop = async (unitConfig, ...args) => {
  __DEV__ && console.log('- - - [defaultCommandStop]', ...args)
  await killProcessInfoAsync({ pid: args[ 0 ] })
}

const formatUnitConfig = ({
  name,
  clue = { pid: true },
  run,
  limit = {}
}, formatPath) => {
  string(name, 'invalid unitConfig.name')

  basicObject(clue, `invalid unitConfig.clue for ${name}`)
  if (clue.pid) clue = { pid: Boolean(clue.pid) }
  else if (clue.pidFile) clue = { pidFile: formatPath(clue.pidFile) }
  else if (clue.commandPattern) clue = { commandPattern: formatPattern(clue.commandPattern) }
  else if (clue.containerImagePattern) clue = { containerImagePattern: formatPattern(clue.containerImagePattern) }
  else if (clue.containerNamesPattern) clue = { containerNamesPattern: formatPattern(clue.containerNamesPattern) }
  else throw new Error(`no supported unitConfig.clue for ${name}`)
  const isCheckDocker = clue.containerImagePattern || clue.containerNamesPattern

  basicObject(run, `invalid unitConfig.run for ${name}`)
  const __run = {
    isMajorUnit: Boolean(run.isMajorUnit),
    start: formatCommand(run.start, formatPath, 'run-detached'),
    stop: run.stop ? formatCommand(run.stop, formatPath) : defaultCommandStop,
    reset: (run.reset || run.stop) ? formatCommand((run.reset || run.stop), formatPath) : defaultCommandStop,
    resetSub: (run.resetSub || run.reset) ? formatCommand((run.resetSub || run.reset), formatPath) : defaultCommandStop
  }

  basicObject(limit, `invalid unitConfig.limit for ${name}`)
  limit = {
    memoryMaxTotalMiB: limit.memoryMaxTotalMiB || 0,
    memoryMaxSubProcessMiB: limit.memoryMaxSubProcessMiB || 0
  }

  return { name, clue, __run, limit, isCheckDocker }
}

const formatLoopConfig = ({
  configRoot = process.cwd(),
  stateFilePath = '',

  loopTime = 6 * 1000, // in msec, how long to wait between loops
  loopCheckInterval = 5, // how many fast loop is allowed before a slow check loop
  loopStartReRunInterval = 2, // how many loop to skip before re-run start

  unitConfigList = [] || [ SAMPLE_UNIT_CONFIG ], // HACK: NOTE: mark sample data
  isCheckDocker = false // todo: check docker related config
}) => {
  const formatPath = (...path) => resolve(configRoot, ...path)
  stateFilePath = formatPath(stateFilePath)

  unitConfigList = unitConfigList.map((unitConfig) => formatUnitConfig(unitConfig, formatPath))
  isCheckDocker = Boolean(isCheckDocker || unitConfigList.some((unitConfig) => unitConfig.isCheckDocker))

  const nameSet = new Set()
  for (const { name } of unitConfigList) {
    if (nameSet.has(name)) throw new Error(`duplicate unitConfig.name: ${name}`)
    nameSet.add(name)
  }

  return {
    configRoot, stateFilePath,
    loopTime, loopCheckInterval, loopStartReRunInterval,
    unitConfigList, isCheckDocker
  }
}

// =============================================================================
// loop state

const LOOP_STATE = { // will save to JSON on every loop
  stateFilePath: '',
  loopIndex: 0, // update on loop step
  loopHistoryList: [ // max history: MAX_HISTORY_LENGTH
    { time: 2, note: '#99 load' },
    { time: 1, note: '#10 update' },
    { time: 0, note: '#0 init' }
  ],
  unitStateMap: {
    'name': { // unitState
      historyList: [ // max history: MAX_HISTORY_LENGTH
        { time: 3, loopCount: 0, state: 'found->missing', reason: 'limit.memoryMaxTotalMiB' }, // wait stop
        { time: 2, loopCount: 10, state: 'found' },
        { time: 1, loopCount: 1, state: 'missing->found', reason: 'clue|run.start' }, // wait start
        { time: 0, loopCount: 2, state: 'missing' }
      ],
      latestFoundTime: 0, latestMissingTime: 0,
      clueProcessInfo: { pid: 0, command: '' } || null // found unit, used to match process
    }
  },
  loopExtraData: {} // custom JSON data
}
__DEV__ && console.log({ LOOP_STATE })

const MAX_HISTORY_LENGTH = 16
const chopListLength = (list) => { if (list.length > MAX_HISTORY_LENGTH) list.length = MAX_HISTORY_LENGTH }

const addLoopHistory = (loopHistoryList, ...noteList) => {
  loopHistoryList.unshift({ time: Date.now(), note: noteList.filter(Boolean).join(' ') })
  chopListLength(loopHistoryList)
}

const initUnitState = () => ({
  historyList: [ { time: Date.now(), loopCount: 0, state: 'missing', reason: 'init' } ],
  latestFoundTime: 0,
  latestMissingTime: Date.now(),
  clueProcessInfo: null
})

const initLoopState = (loopConfig, loopExtraData = {}) => {
  const loopHistoryList = []

  const unitStateMap = {}
  for (const unitConfig of loopConfig.unitConfigList) {
    unitStateMap[ unitConfig.name ] = initUnitState()
  }

  addLoopHistory(loopHistoryList, '#0 init')

  return { loopIndex: 0, loopHistoryList, unitStateMap, loopExtraData } // LOOP_STATE
}

const loadLoopState = async (loopConfig) => {
  if (!await existPath(loopConfig.stateFilePath)) return initLoopState(loopConfig) // new config

  const {
    loopIndex,
    loopHistoryList,
    unitStateMap: loadUnitStateMap,
    loopExtraData = {}
  } = await readJSON(loopConfig.stateFilePath)

  const unitStateMap = {}
  for (const unitConfig of loopConfig.unitConfigList) {
    const prevUnitState = loadUnitStateMap[ unitConfig.name ]
    unitStateMap[ unitConfig.name ] = prevUnitState || initUnitState()
  }

  const danglingUnitTagList = []
  for (const [ prevName, prevUnitState ] of Object.entries(loadUnitStateMap)) {
    if (!unitStateMap[ prevName ] && latestUnitStateHistory(prevUnitState).state.startsWith('found')) danglingUnitTagList.push(`${prevName}@${prevUnitState.clueProcessInfo.pid}`)
  }

  addLoopHistory(loopHistoryList, `#${loopIndex} load`, danglingUnitTagList.length && `dangling: ${danglingUnitTagList.join(',')}`) // TODO: no config to stop these dangling unit

  return { loopIndex, loopHistoryList, unitStateMap, loopExtraData }
}

const saveLoopState = async (loopConfig, loopState) => {
  await createDirectory(dirname(loopConfig.stateFilePath))
  await writeJSON(loopConfig.stateFilePath, loopState)
}
const copyLoopState = (loopConfig) => JSON.parse(JSON.stringify(loopConfig)) // deep copy

const migrateLoopState = async (loopConfig, prevLoopConfig, prevLoopState) => { // TODO: needed?
  prevLoopState = copyLoopState(prevLoopState)
  const { loopIndex, loopHistoryList, loopExtraData = {} } = prevLoopState

  const unitStateMap = {}
  for (const unitConfig of loopConfig.unitConfigList) {
    const prevUnitState = prevLoopState.unitStateMap[ unitConfig.name ]
    unitStateMap[ unitConfig.name ] = prevUnitState || initUnitState()
  }

  const droppedUnitTagList = []
  for (const prevUnitConfig of prevLoopConfig.unitConfigList) {
    if (unitStateMap[ prevUnitConfig.name ]) continue // still exist
    const prevUnitState = prevLoopState.unitStateMap[ prevUnitConfig.name ]
    if (!latestUnitStateHistory(prevUnitState).state.startsWith('found')) continue // not running // TODO: missing->found state unit may be left around
    droppedUnitTagList.push(`${prevUnitConfig.name}@${prevUnitState.clueProcessInfo.pid}`)
    await prevUnitConfig.__run.stop(prevUnitConfig, prevUnitState.clueProcessInfo.pid) // stop dropped unit
  }

  addLoopHistory(loopHistoryList, `#${loopIndex} migrate`, droppedUnitTagList.length && `drop: ${droppedUnitTagList.join(',')}`)

  return { loopIndex, loopHistoryList, unitStateMap, loopExtraData }
}

const markLoopState = (loopConfig, loopState, ...noteList) => {
  const { loopIndex, loopHistoryList } = loopState

  addLoopHistory(loopHistoryList, `#${loopIndex}`, ...noteList)

  return loopState
}

const latestUnitStateHistory = (unitState) => unitState.historyList[ 0 ]
const addUnitStateHistory = (unitState, state, reason = '') => {
  unitState.historyList.unshift({ time: Date.now(), loopCount: 0, state, reason })
  chopListLength(unitState.historyList)
  if (state === 'found') unitState.latestFoundTime = Date.now()
  else if (state === 'missing') unitState.latestMissingTime = Date.now()
}

// =============================================================================
// loop

const LOOP_INDEX = createLoopIndex()
const toMiB = (byte) => Math.round(byte / (2 ** 20))

const loopWaitAndStep = async (loopConfig, loopState) => {
  await setTimeoutAsync(loopConfig.loopTime)
  loopState.loopIndex = LOOP_INDEX.step(loopState.loopIndex, 1)
  for (const unitState of Object.values(loopState.unitStateMap)) unitState.historyList[ 0 ].loopCount++ // do not reset count
}

const getSystemProcessInfo = async ({ isCheckDocker = false }) => {
  // NOTE: the info object is the same on in `processList/PidMap/Tree`
  const processList = await getProcessListAsync() // [ { pid: 0, ppid: 0, memory: 0, command: '', subTree: { ... } } ]
  const processPidMap = toProcessPidMap(processList) // { [pid]: info }
  const processTree = toProcessTree(processList) // A generated ROOT with all info under `subTree`

  const dockerContainerList = isCheckDocker ? await getContainerLsList() : []
  matchContainerLsList(dockerContainerList, processList)

  return {
    processList, processPidMap, processTree,
    dockerContainerList
  }
}

const clueFind = async (unitConfig, unitState, SPI) => {
  const { clue } = unitConfig
  let processInfo
  if (clue.pid) {
    processInfo = clue.pid && isPidExist(clue.pid) && SPI.processPidMap[ clue.pid ]
    if (unitState.clueProcessInfo && unitState.clueProcessInfo.command !== processInfo.command) processInfo = undefined
  } else if (clue.pidFile) {
    const pid = parseInt((await readText(clue.pidFile)).trim())
    processInfo = pid && isPidExist(pid) && SPI.processPidMap[ pid ]
    if (!processInfo && !clue.pidFileKeepStale) await deleteFile(clue.pidFile) // delete stale pidFile
  } else if (clue.commandPattern) {
    processInfo = SPI.processList.find(({ command }) => clue.commandPattern(command))
  } else if (clue.containerImagePattern) {
    const dockerContainer = SPI.dockerContainerList.find(({ image }) => clue.containerImagePattern(image))
    processInfo = dockerContainer && SPI.processList.find(({ pid }) => pid === dockerContainer.pid)
  } else if (clue.containerNamesPattern) {
    const dockerContainer = SPI.dockerContainerList.find(({ names }) => clue.containerNamesPattern(names))
    processInfo = dockerContainer && SPI.processList.find(({ pid }) => pid === dockerContainer.pid)
  }
  return processInfo
}

const loopClue = async (loopConfig, loopState) => { // NOTE: `loopState` is expected to match `unitConfigList`
  const { unitConfigList, isCheckDocker } = loopConfig

  const SPI = await getSystemProcessInfo({ isCheckDocker })
  const foundUnitList = [] // { unitConfig, unitState, processInfo }
  const missingUnitList = [] // { unitConfig, unitState }
  for (const unitConfig of unitConfigList) {
    const unitState = loopState.unitStateMap[ unitConfig.name ]
    const processInfo = await clueFind(unitConfig, unitState, SPI)
    if (processInfo) {
      if (unitState.clueProcessInfo && unitState.clueProcessInfo.pid !== processInfo.pid) addUnitStateHistory(unitState, 'found', 'clue:pid-change')
      if (!latestUnitStateHistory(unitState).state.startsWith('found')) addUnitStateHistory(unitState, 'found', 'clue:found')
      unitState.clueProcessInfo = { pid: processInfo.pid, command: processInfo.command } // drop extra data
      foundUnitList.push({ unitConfig, unitState, processInfo })
    } else {
      if (!latestUnitStateHistory(unitState).state.startsWith('missing')) addUnitStateHistory(unitState, 'missing', 'clue:missing')
      unitState.clueProcessInfo = null
      missingUnitList.push({ unitConfig, unitState })
    }
  }

  __DEV__ && foundUnitList.length && console.log('- found', foundUnitList.map((v) => `${v.unitConfig.name}@${v.processInfo.pid}`).join(','))
  __DEV__ && missingUnitList.length && console.log('- missing', missingUnitList.map((v) => `${v.unitConfig.name}`).join(','))
  return { SPI, foundUnitList, missingUnitList }
}

const limitCheck = async (unitConfig, processInfo) => {
  const { limit } = unitConfig
  if (limit.memoryMaxSubProcessMiB) {
    let isLimitHit = false
    for (const subInfo of processInfo.subInfoList) {
      if (toMiB(subInfo.memory) < limit.memoryMaxSubProcessMiB) continue
      isLimitHit = true
      __DEV__ && console.log(`- - [Limit|memoryMaxSubProcessMiB|${unitConfig.name}] ${toMiB(subInfo.memory)}M >= ${limit.memoryMaxSubProcessMiB}M | ${subInfo.command}`)
      await unitConfig.__run.resetSub(unitConfig, subInfo.pid)
    }
    if (isLimitHit) return // if hit, skip check memoryTotalMiB for this loop
  }
  if (limit.memoryMaxTotalMiB && processInfo.memoryTotalMiB >= limit.memoryMaxTotalMiB) {
    __DEV__ && console.log(`- - [Limit|memoryMaxTotalMiB|${unitConfig.name}] ${processInfo.memoryTotalMiB}M >= ${limit.memoryMaxTotalMiB}M`)
    return 'memoryMaxTotalMiB'
  }
}

const statusCheck = async (unitConfig, unitState, processInfo = {}) => {
  const { pid, subInfoList = [], memoryTotalMiB = 0 } = processInfo
  const latestState = latestUnitStateHistory(unitState).state
  const isFound = latestState.startsWith('found')
  return [ // name, pid, state-time, state/memory
    unitConfig.name,
    pid || '-',
    time(Date.now() - (isFound ? unitState.latestFoundTime : unitState.latestMissingTime)),
    !isFound ? latestState
      : memoryTotalMiB ? `${memoryTotalMiB}M${subInfoList.length ? `=${[ processInfo, ...subInfoList ].map(({ memory }) => toMiB(memory)).join('+')}` : ''}` : '-'
  ]
}

const loopMain = async (loopConfig, loopState, {
  isNoStart = false // just update & kill, for later stop or change loop config
} = {}) => { // NOTE: `loopState.unitStateMap` is expected to match `unitConfigList` in number
  const { loopCheckInterval, loopStartReRunInterval } = loopConfig

  if (loopState.__isAllFound && (loopState.loopIndex % loopCheckInterval) !== 0) { // fast loop, try skip
    __DEV__ && console.log(`[#${loopState.loopIndex}|FAST]`)
    for (const unitState of Object.values(loopState.unitStateMap)) {
      if (!latestUnitStateHistory(unitState).state.startsWith('found') || !isPidExist(unitState.clueProcessInfo.pid)) loopState.__isAllFound = false
    }
    if (loopState.__isAllFound) return {} // empty object
  }

  __DEV__ && console.log(`[#${loopState.loopIndex}|SLOW-CHECK]`)
  const { SPI, foundUnitList, missingUnitList } = await loopClue(loopConfig, loopState)
  loopState.__isAllFound = !missingUnitList.length

  const table = []
  const hasMissingMajorUnit = missingUnitList.some(({ unitConfig: { __run: { isMajorUnit } } }) => isMajorUnit)
  for (const { unitConfig, unitState } of missingUnitList) { // spawn missing unit, will check next loop
    if (!isNoStart) { // skip start attempt
      latestUnitStateHistory(unitState).state !== 'missing->found' && addUnitStateHistory(unitState, 'missing->found', 'run.start')
      if ((unitState.historyList[ 0 ].loopCount % loopStartReRunInterval) === 0) { // re-run after some loop
        if (!hasMissingMajorUnit || unitConfig.__run.isMajorUnit) await unitConfig.__run.start(unitConfig) // only start major unit this loop, if it's found missing
      }
    }
    table.push(await statusCheck(unitConfig, unitState))
  }
  for (const { unitConfig, unitState, processInfo } of foundUnitList) { // monitor rss usage, OOM kill
    processInfo.subInfoList = flattenProcessTree(processInfo)
    processInfo.memoryTotalMiB = toMiB(processInfo.memory + processInfo.subInfoList.reduce((o, { memory }) => o + memory, 0))
    const resetReason = await limitCheck(unitConfig, processInfo)
    if (resetReason) {
      latestUnitStateHistory(unitState).state !== 'found->missing' && addUnitStateHistory(unitState, 'found->missing', `limit:${resetReason}`)
      if ((unitState.historyList[ 0 ].loopCount % loopStartReRunInterval) === 0) await unitConfig.__run.reset(unitConfig, processInfo.pid) // re-run after some loop
    }
    table.push(await statusCheck(unitConfig, unitState, processInfo))
  }

  const statusList = [ ...padTable({ table, cellPad: ' ', rowPad: '\0' }).split('\0') ]
  return { SPI, foundUnitList, missingUnitList, statusList }
}

const loopStop = async (loopConfig, loopState) => {
  const { SPI, foundUnitList, missingUnitList } = await loopClue(loopConfig, loopState)
  for (const { unitConfig, unitState, processInfo } of foundUnitList) { // stop found unit
    latestUnitStateHistory(unitState).state !== 'found->missing' && addUnitStateHistory(unitState, 'found->missing', 'run.stop')
    if (unitState.historyList[ 0 ].loopCount === 0) await unitConfig.__run.stop(unitConfig, processInfo.pid)
  }
  return { SPI, foundUnitList, missingUnitList }
}

export {
  // loop config
  defaultCommandStop,
  formatUnitConfig, formatLoopConfig,

  // loop state
  initLoopState, loadLoopState, saveLoopState, migrateLoopState, markLoopState,
  latestUnitStateHistory, addUnitStateHistory,

  // loop
  LOOP_INDEX,
  loopWaitAndStep, loopClue, loopMain, loopStop
}
