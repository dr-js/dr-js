import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { createLogQueue } from 'source/common/data'
import { createStateStore } from 'source/common/immutable'
import { createDirectory, getFileList } from 'source/node/file'
import { createSafeWriteStream } from './SafeWrite'

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)

// TODO: factLog file merge

const LOG_FILE_SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // 24hour

const createFactDatabase = async ({
  applyFact, // (state, fact) => nextState
  encodeFact, // (fact) => factText
  decodeFact, // (factText) => fact
  pathFactDirectory,
  nameFactLogFile = 'factLog',
  nameFactStateFile = 'factState',
  queueLengthThreshold,
  fileSplitInterval = LOG_FILE_SPLIT_INTERVAL,
  onError
}) => {
  await createDirectory(pathFactDirectory)
  let { factId, factState } = await loadStateFromFile({ applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactStateFile })
  const store = createStateStore(factState)
  let logger
  const resetLogger = () => {
    const factLogFile = nodeModulePath.join(pathFactDirectory, `${nameFactLogFile}.${factId + 1}.log`)
    const factStateFile = nodeModulePath.join(pathFactDirectory, `${nameFactStateFile}.${factId + 1}.json`)
    logger && logger.end()
    logger = createLogQueue({ queueLengthThreshold, outputStream: createSafeWriteStream({ pathOutputFile: factLogFile, onError, option: { flag: 'w', encoding: 'utf8' } }) })
    __DEV__ && console.log('[Logger] open new fact log:', factLogFile)
    writeFileAsync(factStateFile, JSON.stringify({ factId, factState: store.getState() })) // may not always success finish on progress exit
  }
  resetLogger()
  let token = setInterval(resetLogger, fileSplitInterval)
  return {
    getState: store.getState,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    addFact: (fact) => {
      fact.id = factId + 1
      store.setState(applyFact(store.getState(), fact))
      logger.add(encodeFact(fact))
      factId++
    },
    save: resetLogger,
    end: () => {
      token && clearInterval(token) && (token = null)
      logger && logger.end() && (logger = null)
    }
  }
}

const regexpLogFileId = /\.(\d+)\.log$/
const regexpStateFileId = /\.(\d+)\.json$/
const loadStateFromFile = async ({ applyFact, decodeFact, pathFactDirectory, nameFactLogFile, nameFactStateFile }) => {
  const filePathList = await getFileList(pathFactDirectory, (fileList) => (path, name) => fileList.push({ filePath: nodeModulePath.join(path, name), path, name }))
  let { factLogFileList, factStateFileList } = filePathList.reduce((o, { filePath, name }) => {
    name.startsWith(nameFactLogFile) && regexpLogFileId.test(name) && o.factLogFileList.push({ fileId: parseInt(regexpLogFileId.exec(name)[ 1 ], 36), filePath })
    name.startsWith(nameFactStateFile) && regexpStateFileId.test(name) && o.factStateFileList.push({ fileId: parseInt(regexpStateFileId.exec(name)[ 1 ], 36), filePath })
    return o
  }, { factLogFileList: [], factStateFileList: [] })

  let factId = 0
  let factState = {}

  // first check if cached state is available
  factStateFileList.sort((a, b) => b.fileId - a.fileId) // bigger id first
  for (const { filePath } of factStateFileList) {
    try {
      __DEV__ && console.log('found cached fact state file:', filePath)
      const factData = JSON.parse(await readFileAsync(filePath, { encoding: 'utf8' }))
      factId = factData.factId
      factState = factData.factState
      __DEV__ && console.log('load cached fact state with factId:', factId)
      break
    } catch (error) { __DEV__ && console.warn('failed to load cached fact state file:', filePath, error) }
  }

  // then load minimal added state from log
  const maxFactLogId = factLogFileList.reduce((maxFactLogId, { fileId }) => fileId <= factId + 1 ? Math.max(maxFactLogId, fileId) : maxFactLogId, 0)
  factLogFileList = factLogFileList
    .filter(({ fileId }) => fileId >= maxFactLogId)
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

  __DEV__ && console.log('loaded', factId, factState)
  return { factId, factState }
}

export { createFactDatabase }
