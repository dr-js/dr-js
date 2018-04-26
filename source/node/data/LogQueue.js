const DEFAULT_QUEUE_LENGTH_THRESHOLD = __DEV__ ? 10 : 1024

const createLogQueue = ({
  outputStream,
  queueLengthThreshold = DEFAULT_QUEUE_LENGTH_THRESHOLD
}) => {
  const logQueue = [] // buffered log

  const pullLog = () => {
    logQueue.push('') // for an extra '\n'
    const string = logQueue.join('\n')
    logQueue.length = 0
    return string
  }

  const add = (logString) => { // will trigger save on threshold
    __DEV__ && console.log('[LogQueue] log', logString)
    logQueue.push(logString)
    logQueue.length > queueLengthThreshold && save()
  }

  const save = () => {
    if (logQueue.length === 0) return
    __DEV__ && console.log('[LogQueue] save')
    outputStream.write(pullLog())
  }

  const end = () => {
    __DEV__ && console.log('[LogQueue] end')
    logQueue.length !== 0 && outputStream.write(pullLog())
    outputStream.end()
  }

  return { add, save, end }
}

export { createLogQueue }
