import { resolve } from 'path'
import { createDirectory } from 'source/node/file/Directory'
import { createSafeWriteStream } from './SafeWrite'

const DEFAULT_QUEUE_LENGTH_THRESHOLD = __DEV__ ? 10 : 1024

const createLogQueue = ({
  outputStream, // this expect to be `source/node/module/SafeWrite.js` or similar implementation
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

const createSimpleLogger = ({ queueLengthThreshold, ...extraOption }) => createLogQueue({
  outputStream: createSafeWriteStream(extraOption),
  queueLengthThreshold
})

const SAVE_INTERVAL = 30 * 1000 // in ms, 30sec
const SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // in ms, 24day

const createLogger = async ({
  pathLogDirectory,
  getLogFileName = () => `${(new Date().toISOString()).replace(/\W/g, '-')}.log`,
  saveInterval = SAVE_INTERVAL,
  splitInterval = SPLIT_INTERVAL,
  ...extraOption
}) => {
  let logger
  let saveToken
  let splitToken

  const reset = () => {
    end()
    const pathOutputFile = resolve(pathLogDirectory, getLogFileName())
    logger = createSimpleLogger({ ...extraOption, pathOutputFile })
    saveToken = saveInterval && setInterval(save, saveInterval)
    splitToken = splitInterval && setTimeout(split, splitInterval)
  }

  const add = (...args) => {
    // __DEV__ && logger && console.log('[Logger] add')
    logger && logger.add(args.join(' '))
  }
  const save = () => {
    __DEV__ && logger && console.log('[Logger] save')
    logger && logger.save()
  }
  const split = () => {
    __DEV__ && logger && console.log('[Logger] split')
    logger && reset()
  }
  const end = () => {
    __DEV__ && logger && console.log('[Logger] end')
    logger && logger.end()
    saveToken && clearInterval(saveToken)
    splitToken && clearTimeout(splitToken)
    logger = undefined
    saveToken = undefined
    splitToken = undefined
  }

  await createDirectory(pathLogDirectory)
  reset()

  return { add, save, split, end }
}

export { createSimpleLogger, createLogger }
