import nodeModuleFs from 'fs'

const DEFAULT_LOG_LENGTH_THRESHOLD = __DEV__ ? 10 : 1024
const DEFAULT_ON_ERROR = (error) => {
  console.warn(error)
  throw error
}

const createLogger = ({
  logFilePath,
  logLengthThreshold = DEFAULT_LOG_LENGTH_THRESHOLD,
  onError = DEFAULT_ON_ERROR
}) => {
  const logQueue = [] // buffered log
  const writeSet = new Set() // pending log in write stream
  const logStream = nodeModuleFs.createWriteStream(logFilePath, { flags: 'a' })
  logStream.on('error', onError)

  const consumeLogQueue = () => {
    logQueue.push('') // for an extra '\n'
    const writeString = logQueue.join('\n')
    logQueue.length = 0
    return writeString
  }

  const log = (logString) => {
    __DEV__ && console.log('[Logger] log', logString)
    logQueue.push(logString)
    logQueue.length > logLengthThreshold && save()
  }

  const save = () => {
    if (logQueue.length === 0) return
    __DEV__ && console.log('[Logger] save')
    const writeString = consumeLogQueue()
    writeSet.add(writeString)
    logStream.write(writeString, () => {
      __DEV__ && console.log('[Logger] saveLog finished')
      writeSet.delete(writeString)
    })
  }

  const end = () => {
    __DEV__ && console.log('[Logger] end')
    logStream.destroy() // added in node v8.0.0, as end() will not close the stream immediately
    logQueue.length !== 0 && writeSet.add(consumeLogQueue())
    writeSet.size !== 0 && nodeModuleFs.appendFileSync(logFilePath, Array.from(writeSet).join(''))
    writeSet.clear()
  }

  return {
    log, // will trigger save on threshold
    end
  }
}

export { createLogger }
