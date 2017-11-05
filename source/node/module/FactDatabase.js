import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { createLogQueue } from 'source/common/data'
import { createStateStore } from 'source/common/immutable'
import { createDirectory, getFileList } from 'source/node/file'
import { createSafeWriteStream } from './SafeWrite'

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)
const FILE_SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // 24hour

// lightweight log-based database
// TODO: factLog file merge

const createFactDatabase = async ({
  applyFact, // (state, fact) => nextState
  encodeFact, // (fact) => factText
  decodeFact, // (factText) => fact
  pathFactDirectory,
  nameFactLogFile = 'factLog',
  nameFactStateFile = 'factState',
  queueLengthThreshold,
  fileSplitInterval = FILE_SPLIT_INTERVAL,
  onError
}) => {
  await createDirectory(pathFactDirectory)
  let { factId, factState } = await loadStateFromFile({ applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactStateFile })
  __DEV__ && console.log('[Logger] loaded', factId, factState)
  const store = createStateStore(factState)
  const saveFactState = () => {
    const factStateFile = nodeModulePath.join(pathFactDirectory, `${nameFactStateFile}.${factId}.json`)
    writeFileAsync(factStateFile, JSON.stringify({ factId, factState: store.getState() })) // may not always success finish on progress exit
    __DEV__ && console.log('[Logger] save fact state:', factStateFile)
  }
  let logger = null
  const splitFactLogFile = () => {
    saveFactState()
    logger && logger.end()
    const factLogFile = nodeModulePath.join(pathFactDirectory, `${nameFactLogFile}.${factId + 1}.log`)
    logger = createLogQueue({ outputStream: createSafeWriteStream({ pathOutputFile: factLogFile, onError }), queueLengthThreshold })
    __DEV__ && console.log('[Logger] open new fact log:', factLogFile)
  }
  splitFactLogFile()
  let intervalToken = setInterval(splitFactLogFile, fileSplitInterval)
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    add: (fact) => {
      fact.id = factId + 1
      store.setState(applyFact(store.getState(), fact))
      logger && logger.add(encodeFact(fact))
      factId++
    },
    save: () => {
      logger && logger.save()
      saveFactState()
    },
    split: splitFactLogFile,
    end: () => {
      intervalToken && clearInterval(intervalToken) && (intervalToken = null)
      logger && logger.end() && (logger = null)
    }
  }
}

const regexpLogFileId = /\.(\d+)\.log$/
const regexpStateFileId = /\.(\d+)\.json$/
const loadStateFromFile = async ({ applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactStateFile }) => {
  const filePathList = await getFileList(pathFactDirectory, (fileList) => (path, name) => fileList.push({ filePath: nodeModulePath.join(path, name), path, name }))
  let { factLogFileList, factStateFileList } = filePathList.reduce((o, { filePath, name }) => {
    name.startsWith(nameFactLogFile) && regexpLogFileId.test(name) && o.factLogFileList.push({ fileId: parseInt(regexpLogFileId.exec(name)[ 1 ]), filePath })
    name.startsWith(nameFactStateFile) && regexpStateFileId.test(name) && o.factStateFileList.push({ fileId: parseInt(regexpStateFileId.exec(name)[ 1 ]), filePath })
    return o
  }, { factLogFileList: [], factStateFileList: [] })
  let factInfo = { factId: 0, factState: {} }
  factInfo = await tryLoadFactState(factInfo, { factStateFileList })
  factInfo = await tryLoadFactLog(factInfo, { factLogFileList, decodeFact, applyFact })
  return factInfo
}
const tryLoadFactState = async (factInfo, { factStateFileList }) => { // first check if cached state is available
  factStateFileList.sort((a, b) => b.fileId - a.fileId) // bigger id first
  for (const { filePath } of factStateFileList) {
    try {
      __DEV__ && console.log('found cached fact state file:', filePath)
      const factData = JSON.parse(await readFileAsync(filePath, { encoding: 'utf8' }))
      __DEV__ && console.log('load cached fact state with factId:', factData.factId)
      return factData
    } catch (error) { __DEV__ && console.warn('failed to load cached fact state file:', filePath, error) }
  }
  return factInfo
}
const tryLoadFactLog = async ({ factId, factState }, { factLogFileList, decodeFact, applyFact }) => { // then load minimal added state from log
  const maxFactLogId = factLogFileList.reduce((maxFactLogId, { fileId }) => fileId <= factId + 1 ? Math.max(maxFactLogId, fileId) : maxFactLogId, 0)
  factLogFileList = factLogFileList
    .filter(({ fileId }) => (fileId >= maxFactLogId))
    .sort((a, b) => a.fileId - b.fileId) // smaller id first
  __DEV__ && factLogFileList.length && console.log('found fact log file:', factLogFileList.length, 'maxFactLogId:', maxFactLogId)
  for (const { filePath } of factLogFileList) {
    const fileText = await readFileAsync(filePath, { encoding: 'utf8' })
    fileText.split('\n').forEach((logText) => {
      if (!logText) return
      const fact = decodeFact(logText)
      if (fact.id <= factId) return
      factState = applyFact(factState, fact)
      factId = fact.id
    })
    __DEV__ && console.log('load fact log file:', filePath, factId)
  }
  return { factId, factState }
}

export { createFactDatabase }
