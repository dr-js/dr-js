import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { createLogQueue } from 'source/common/data'
import { createStateStore } from 'source/common/immutable'
import { createDirectory, getFileList } from 'source/node/file'
import { createSafeWriteStream } from './SafeWrite'

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)

const LOG_FILE_SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // 24hour

const loadStateFromFile = async ({
  applyFact,
  decodeFact,
  pathFactDirectory,
  logFilePrefix,
  cacheStateFileName
}) => {
  const filePathList = await getFileList(pathFactDirectory, (fileList) => (path, name) => fileList.push({ filePath: nodeModulePath.join(path, name), path, name }))
  let factId = 0
  let factState = {}

  // first check if cached state is available
  const factStateFile = filePathList.find(({ filePath }) => filePath.endsWith(cacheStateFileName))
  if (factStateFile) {
    __DEV__ && console.log('found cached fact state', factStateFile)
    const factData = JSON.parse(await readFileAsync(factStateFile.filePath, { encoding: 'utf8' }))
    factId = factData.factId
    factState = factData.factState
    __DEV__ && console.log('load cached fact state with factId:', factId)
  }

  // load and reduce
  const regexpFactId = new RegExp(`\\.(\\d+)\\.log`)
  let maxStartFactId = 0
  const pendingFactLogFileList = filePathList.reduce((o, { filePath, name }) => {
    if (name.startsWith(logFilePrefix) && regexpFactId.test(name)) {
      const [ , factIdString ] = regexpFactId.exec(name)
      const fileFactId = Number(factIdString)
      o.push({ fileFactId, filePath })
      if (fileFactId <= factId + 1) maxStartFactId = Math.max(fileFactId, maxStartFactId)
    }
    return o
  }, []).filter(({ fileFactId }) => fileFactId >= maxStartFactId)

  pendingFactLogFileList.sort((a, b) => a.fileFactId - b.fileFactId)

  __DEV__ && pendingFactLogFileList.length && console.log('found fact log file:', pendingFactLogFileList.length, 'factID:', pendingFactLogFileList[ 0 ].fileFactId)

  for (const { filePath } of pendingFactLogFileList) {
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

  __DEV__ && console.log('load', factId, factState)

  return { factId, factState }
}

const createFactDatabase = async ({
  applyFact, // (state, fact) => nextState
  encodeFact, // (fact) => factText
  decodeFact, // (factText) => fact
  pathFactDirectory,
  queueLengthThreshold,
  logFilePrefix,
  cacheStateFileName = 'factCacheState.json',
  fileSplitInterval = LOG_FILE_SPLIT_INTERVAL,
  onError
}) => {
  await createDirectory(pathFactDirectory)
  let { factId, factState } = await loadStateFromFile({
    applyFact,
    decodeFact,
    pathFactDirectory,
    logFilePrefix,
    cacheStateFileName
  })
  const store = createStateStore(factState)

  let logger, token
  const resetLogger = () => {
    logger && logger.end()
    const pathOutputFile = nodeModulePath.join(pathFactDirectory, `${logFilePrefix}.${factId + 1}.log`)
    logger = createLogQueue({ queueLengthThreshold, outputStream: createSafeWriteStream({ pathOutputFile, onError, option: { flags: 'w', encoding: 'utf8' } }) })
    __DEV__ && console.log('[] open fact log:', `${logFilePrefix}.${factId + 1}.log`)
    writeFileAsync(nodeModulePath.join(pathFactDirectory, cacheStateFileName), JSON.stringify({ factId, factState: store.getState() }))
    __DEV__ && console.log('[] save cached fact state:', factId, store.getState())
  }
  resetLogger()
  token = setInterval(resetLogger, fileSplitInterval)

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    addFact: (fact) => {
      factId++
      fact.id = factId
      store.setState(applyFact(store.getState(), fact))
      logger.add(encodeFact(fact))
    },
    save: resetLogger,
    end: () => {
      token && clearInterval(token)
      token = null
      logger && logger.end()
      logger = null
    }
  }
}

export { createFactDatabase }
