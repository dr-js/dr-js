import { join as joinPath } from 'path'
import { catchAsync } from 'source/common/error'
import { lossyAsync } from 'source/common/function'
import { tryParseJSONObject } from 'source/common/data/function'
import { createStateStore } from 'source/common/immutable/StateStore'

import { readFileAsync, writeFileAsync, unlinkAsync, createReadlineFromFileAsync } from 'source/node/file/function'
import { getDirectorySubInfoList } from 'source/node/file/Directory'
import { createLogger } from './Logger'

// lightweight log-based database
//
//   fact:
//     an object with id like:
//       { id, ... }
//
//   factState:
//     the state object from reduce `applyFact`, will also have `id`, initial state:
//       { id, ... }
//
//   fact log:
//     save fact line by line, can reconstruct factState by redo all the reduce
//
//   fact cache:
//     for faster save/load factState, save the `factState` at `id`, like:
//       { factId, factState }
//

const DEFAULT_LOG_FILE_NAME = 'factLog'
const DEFAULT_CACHE_FILE_NAME = 'factCache'

const INITIAL_STATE = { id: 0 }
const INITIAL_FACT_INFO = {
  factId: 0,
  factState: INITIAL_STATE,
  factCacheFile: '',
  factLogFile: ''
}

// TODO: consider if the log must be encoded with out the '\n' (limited encode fact to JSON)?
// TODO: consider use [ base36, base36 ] for Id?
// TODO: consider explicit support for drop leading log and only use cache + part of log?

const createFactDatabase = async ({
  initialFactInfo,
  initialState = INITIAL_STATE,
  applyFact = (state, fact) => ({ ...state, ...fact }), // (state, fact) => nextState
  encodeFact = JSON.stringify, // (fact) => factText
  decodeFact = JSON.parse, // (factText) => fact
  pathFactDirectory,
  nameFactLogFile = DEFAULT_LOG_FILE_NAME,
  nameFactCacheFile = DEFAULT_CACHE_FILE_NAME,
  onError,
  ...extraOption
}) => {
  if (initialFactInfo === undefined) {
    initialFactInfo = await tryLoadFactInfo(
      { ...INITIAL_FACT_INFO, factState: initialState },
      { applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactCacheFile }
    )
    __DEV__ && console.log('loaded initialFactInfo:', initialFactInfo)
  }

  let isActive = true
  let factId = initialFactInfo.factId || 0
  let prevFactCacheFile = initialFactInfo.factCacheFile || ''

  const { getState, setState, subscribe, unsubscribe } = createStateStore(initialFactInfo.factState)

  const factLogger = await createLogger({
    ...extraOption,
    pathLogDirectory: pathFactDirectory,
    getLogFileName: () => `${nameFactLogFile}.${factId + 1}.log`,
    onError
  })

  const { trigger: saveFactCache, getRunningPromise: getSaveFactCachePromise } = lossyAsync(async () => {
    const factCacheFile = joinPath(pathFactDirectory, `${nameFactCacheFile}.${factId}.json`)
    if (prevFactCacheFile === factCacheFile) return // skip save

    const fileContent = JSON.stringify({ factId, factState: getState() })

    __DEV__ && console.log('[saveFactCache] saving fact state:', factCacheFile)
    await writeFileAsync(factCacheFile, fileContent) // may not always finish on progress exit

    __DEV__ && prevFactCacheFile && console.log('[saveFactCache] dropping prev fact state:', prevFactCacheFile)
    prevFactCacheFile && await unlinkAsync(prevFactCacheFile).catch((error) => { __DEV__ && console.warn('[saveFactCache] clear failed:', prevFactCacheFile, error) })

    __DEV__ && console.log('[saveFactCache] done save fact state')
    prevFactCacheFile = factCacheFile
  }, onError)

  return {
    getState,
    getIsActive: () => isActive,
    getSaveFactCachePromise, // maybe a promise or undefined
    subscribe,
    unsubscribe,
    add: (fact) => {
      if (!isActive) return
      if (factId >= Number.MAX_SAFE_INTEGER) throw new Error(`[FactDatabase] factId is Number.MAX_SAFE_INTEGER: ${factId}`) // TODO: handle Integer explode
      fact.id = factId + 1
      factId++
      factLogger.add(encodeFact(fact))
      setState(applyFact(getState(), fact))
    },
    save: () => {
      if (!isActive) return
      __DEV__ && console.log('[save]', factId)
      factLogger.save()
    },
    split: () => {
      if (!isActive) return
      __DEV__ && console.log('[split]', factId)
      factLogger.split()
      saveFactCache()
    },
    end: () => {
      if (!isActive) return
      __DEV__ && console.log('[end]', factId)
      isActive = false
      factLogger.end()
      saveFactCache()
    }
  }
}

const tryLoadFactInfo = async (factInfo, { applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactCacheFile }) => {
  const factLogFileList = []
  const factCacheFileList = []
  const { error } = await catchAsync(async () => (await getDirectorySubInfoList(pathFactDirectory)).forEach(({ path, name }) => {
    name.startsWith(nameFactLogFile) && REGEXP_LOG_FILE.test(name) && factLogFileList.push({ fileId: parseInt(REGEXP_LOG_FILE.exec(name)[ 1 ]), path, name })
    name.startsWith(nameFactCacheFile) && REGEXP_CACHE_FILE.test(name) && factCacheFileList.push({ fileId: parseInt(REGEXP_CACHE_FILE.exec(name)[ 1 ]), path, name })
  }))

  __DEV__ && error && console.log('[tryLoadFactInfo] failed to get content at:', pathFactDirectory)

  factInfo = await tryLoadFactInfoFromCache(factInfo, { factCacheFileList })
  factInfo = await tryLoadFactInfoFromLog(factInfo, { factLogFileList, decodeFact, applyFact })
  return factInfo
}
const REGEXP_LOG_FILE = /\.(\d+)\.log$/
const REGEXP_CACHE_FILE = /\.(\d+)\.json$/

const tryLoadFactInfoFromCache = async (factInfo, { factCacheFileList }) => { // first check if cached state is available
  factCacheFileList.sort((a, b) => b.fileId - a.fileId) // bigger id first
  for (const { path, name } of factCacheFileList) {
    __DEV__ && console.log('try cached fact state file:', name)
    const { factId, factState } = tryParseJSONObject(await readFileAsync(path))
    __DEV__ && console.log('load cached fact state with factId:', factId, name)
    if (factId) return { ...factInfo, factId, factState, factCacheFile: path }
  }
  return factInfo
}

const tryLoadFactInfoFromLog = async (factInfo, { factLogFileList, decodeFact, applyFact }) => { // then load minimal added state from log
  let { factId, factState, factLogFile = '' } = factInfo
  const maxFactLogId = factLogFileList.reduce((o, { fileId }) => (fileId <= factId + 1) ? Math.max(o, fileId) : o, 0)

  factLogFileList = factLogFileList
    .filter(({ fileId }) => (fileId >= maxFactLogId))
    .sort((a, b) => a.fileId - b.fileId) // smaller id first
  __DEV__ && factLogFileList.length && console.log('found fact log file:', factLogFileList.length, 'maxFactLogId:', maxFactLogId)

  for (const { path, name } of factLogFileList) {
    await createReadlineFromFileAsync(path, (logText) => { // TODO: should check multiline log? (from non-JSON encodeFact output)
      const fact = logText && decodeFact(logText)
      if (!fact || fact.id <= factId) return
      if (fact.id !== factId + 1) throw new Error(`invalid factId: ${fact.id}, should be: ${factId + 1}. file: ${name}`)
      factState = applyFact(factState, fact)
      factId = fact.id
      factLogFile = path
    })
    __DEV__ && console.log('load fact log file:', name, factId)
  }

  return { ...factInfo, factId, factState, factLogFile }
}

const tryDeleteExtraCache = async ({
  pathFactDirectory,
  nameFactCacheFile = DEFAULT_CACHE_FILE_NAME,
  keepFactId = Infinity,
  keepFileCount = 2
}) => {
  const factCacheFileList = (await getDirectorySubInfoList(pathFactDirectory)).map(({ path, name }) => {
    const fileId = name.startsWith(nameFactCacheFile) && REGEXP_CACHE_FILE.test(name) && parseInt(REGEXP_CACHE_FILE.exec(name)[ 1 ])
    return Number.isInteger(fileId) && { fileId, path, name }
  }).filter(Boolean)
  if (!factCacheFileList.length) return
  factCacheFileList.sort((a, b) => b.fileId - a.fileId)
  let skippedFile = 0
  for (const { fileId, path, name } of factCacheFileList) {
    if (fileId >= keepFactId) continue
    if (skippedFile < keepFileCount) {
      skippedFile += 1
      continue
    }
    __DEV__ && console.log('[DeleteExtraCache] delete:', name)
    const { error } = await catchAsync(unlinkAsync, path)
    __DEV__ && error && console.warn('[DeleteExtraCache] failed to delete:', name, error)
  }
}

export {
  INITIAL_FACT_INFO,
  createFactDatabase,
  tryLoadFactInfo,
  tryDeleteExtraCache
}
