import { join as joinPath } from 'path'
import { createStateStore } from 'source/common/immutable/StateStore'

import { readFileAsync, writeFileAsync, unlinkAsync } from 'source/node/file/__utils__'
import { getDirectoryContentShallow, walkDirectoryContent } from 'source/node/file/Directory'
import { createLogger } from './Logger'

/* lightweight log-based database
*   fact:
*     an object with id like:
*       { id, ... }
*
*   factState:
*     the state object from reduce `applyFact`, may not have `id`, initial state:
*       { }
*
*   fact log:
*     save fact line by line, can reconstruct factState by redo all the reduce
*
*   fact cache:
*     for faster save/load factState, save the `factState` at `id`, like:
*       { factId, factState }
**/

const DEFAULT_LOG_FILE_NAME = 'factLog'
const DEFAULT_CACHE_FILE_NAME = 'factCache'

const createFactDatabase = async ({
  applyFact = (state, fact) => ({ ...state, ...fact }), // (state, fact) => nextState
  encodeFact = JSON.stringify, // (fact) => factText
  decodeFact = JSON.parse, // (factText) => fact
  nameFactLogFile = DEFAULT_LOG_FILE_NAME,
  nameFactCacheFile = DEFAULT_CACHE_FILE_NAME,
  pathFactDirectory,
  queueLengthThreshold, // optional
  fileSplitInterval, // optional
  onError
}) => {
  const { factId: initialFactId, factState: initialFactState } = await loadFactInfoFromFile({
    applyFact,
    decodeFact,
    pathFactDirectory,
    nameFactLogFile,
    nameFactCacheFile
  })

  let factId = initialFactId

  const { getState, setState, subscribe, unsubscribe } = createStateStore(initialFactState)

  const factLogger = await createLogger({
    pathLogDirectory: pathFactDirectory,
    getLogFileName: () => `${nameFactLogFile}.${factId + 1}.log`,
    queueLengthThreshold,
    fileSplitInterval,
    onError
  })

  let isSaving = false
  const doneSave = () => { isSaving = false }
  const saveFactCache = () => {
    if (isSaving) return
    isSaving = true
    writeFactCacheFile(pathFactDirectory, nameFactCacheFile, factId, getState()).then(doneSave, onError)
  }

  return {
    getState,
    subscribe,
    unsubscribe,
    add: (fact) => {
      fact.id = factId + 1
      factId++
      factLogger.add(encodeFact(fact))
      setState(applyFact(getState(), fact))
    },
    save: () => {
      factLogger.save()
      saveFactCache()
    },
    split: () => {
      factLogger.split()
      saveFactCache()
    },
    end: () => factLogger.end()
  }
}

const writeFactCacheFile = async (pathFactDirectory, nameFactCacheFile, factId, factState) => {
  const factCacheFile = joinPath(pathFactDirectory, `${nameFactCacheFile}.${factId}.json`)
  await writeFileAsync(factCacheFile, JSON.stringify({ factId, factState })) // may not always finish on progress exit
  __DEV__ && console.log('[saveFactCache] saved fact state:', factCacheFile)
}

const loadFactInfoFromFile = async ({ applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactCacheFile }) => {
  const factLogFileList = []
  const factCacheFileList = []
  try {
    await walkDirectoryContent(await getDirectoryContentShallow(pathFactDirectory), (path, name) => {
      name.startsWith(nameFactLogFile) && REGEXP_LOG_FILE_ID.test(name) && factLogFileList.push({ fileId: parseInt(REGEXP_LOG_FILE_ID.exec(name)[ 1 ]), path, name })
      name.startsWith(nameFactCacheFile) && REGEXP_CACHE_FILE_ID.test(name) && factCacheFileList.push({ fileId: parseInt(REGEXP_CACHE_FILE_ID.exec(name)[ 1 ]), path, name })
    })
  } catch (error) { __DEV__ && console.log('[loadFactInfoFromFile] failed to get content at:', pathFactDirectory) }

  let factInfo = await tryLoadFactCache({ factCacheFileList })
  factInfo = await tryLoadFactLog(factInfo, { factLogFileList, decodeFact, applyFact })
  return factInfo
}
const REGEXP_LOG_FILE_ID = /\.(\d+)\.log$/
const REGEXP_CACHE_FILE_ID = /\.(\d+)\.json$/

const tryLoadFactCache = async ({ factCacheFileList }) => { // first check if cached state is available
  factCacheFileList.sort((a, b) => b.fileId - a.fileId) // bigger id first
  for (const { path, name } of factCacheFileList) {
    try {
      __DEV__ && console.log('found cached fact state file:', name)
      const factInfo = JSON.parse(await readFileAsync(joinPath(path, name), { encoding: 'utf8' }))
      __DEV__ && console.log('load cached fact state with factId:', factInfo.factId)
      return factInfo
    } catch (error) { __DEV__ && console.warn('failed to load cached fact state file:', name, error) }
  }

  return { factId: 0, factState: {} }
}

const tryLoadFactLog = async ({ factId, factState }, { factLogFileList, decodeFact, applyFact }) => { // then load minimal added state from log
  const maxFactLogId = factLogFileList.reduce((o, { fileId }) => (fileId <= factId + 1) ? Math.max(o, fileId) : o, 0)

  factLogFileList = factLogFileList
    .filter(({ fileId }) => (fileId >= maxFactLogId))
    .sort((a, b) => a.fileId - b.fileId) // smaller id first
  __DEV__ && factLogFileList.length && console.log('found fact log file:', factLogFileList.length, 'maxFactLogId:', maxFactLogId)

  for (const { path, name } of factLogFileList) {
    (await readFileAsync(joinPath(path, name), { encoding: 'utf8' }))
      .split('\n') // TODO: should check multiline log? (from non-JSON encodeFact output)
      .forEach((logText) => {
        const fact = logText && decodeFact(logText)
        if (!fact || fact.id <= factId) return
        if (fact.id !== factId + 1) throw new Error(`invalid factId: ${fact.id}, should be: ${factId + 1}. file: ${name}`)
        factState = applyFact(factState, fact)
        factId = fact.id
      })
    __DEV__ && console.log('load fact log file:', name, factId)
  }

  return { factId, factState }
}

// TODO: remove extra cache file?
const tryDeleteExtraCache = async ({ pathFactDirectory, nameFactCacheFile = DEFAULT_CACHE_FILE_NAME, keepFactId = Infinity }) => {
  let maxFactId = 0
  const factCacheFileList = []
  await walkDirectoryContent(await getDirectoryContentShallow(pathFactDirectory), (path, name) => {
    const fileId = name.startsWith(nameFactCacheFile) && REGEXP_CACHE_FILE_ID.test(name) && parseInt(REGEXP_CACHE_FILE_ID.exec(name)[ 1 ])
    fileId && factCacheFileList.push({ fileId, path, name })
    maxFactId = Math.max(maxFactId, fileId)
  })
  maxFactId = Math.min(maxFactId, keepFactId)
  for (const { fileId, path, name } of factCacheFileList) {
    if (fileId >= maxFactId) continue
    try {
      __DEV__ && console.log('delete cached fact state file:', name)
      await unlinkAsync(joinPath(path, name))
    } catch (error) { __DEV__ && console.warn('failed to delete cached fact state file:', name, error) }
  }
}

export { createFactDatabase, tryDeleteExtraCache }
