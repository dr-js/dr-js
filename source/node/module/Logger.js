import { resolve } from 'path'
import { createDirectory } from 'source/node/file/Directory'
import { createSafeWriteStream } from './SafeWrite'

const DEFAULT_QUEUE_LENGTH_THRESHOLD = __DEV__ ? 10 : 1024

const createSimpleLoggerExot = ({
  id = 'exot:logger-simple',
  queueLengthThreshold = DEFAULT_QUEUE_LENGTH_THRESHOLD,
  ...safeWriteStreamOption
}) => {
  let logQueue
  let safeWriteStream

  const up = (onExotError) => {
    logQueue = [] // buffered log
    safeWriteStream = createSafeWriteStream({ onError: onExotError, ...safeWriteStreamOption })
  }
  const down = () => {
    if (isUp() === false) return
    save()
    safeWriteStream.end()
    logQueue = safeWriteStream = undefined
  }
  const isUp = () => safeWriteStream !== undefined

  const add = (logString) => { // allow single string only, will trigger save on threshold
    logQueue.push(logString)
    logQueue.length > queueLengthThreshold && save()
  }
  const save = () => {
    if (logQueue.length === 0) return
    logQueue.push('') // for an extra '\n'
    safeWriteStream.write(logQueue.join('\n'))
    logQueue.length = 0
  }

  return {
    id, up, down, isUp,
    add, save
  }
}

const SAVE_INTERVAL = 30 * 1000 // in ms, 30sec
const SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // in ms, 1day

// support multiple string `add()`
// added timer for save & file split
const createLoggerExot = ({
  id = 'exot:logger',
  pathLogDirectory,
  getLogFileName = () => `${(new Date().toISOString()).replace(/\W/g, '-')}.log`,
  saveInterval = SAVE_INTERVAL,
  splitInterval = SPLIT_INTERVAL,
  ...simpleLoggerOption
}) => {
  let loggerExot
  let saveToken
  let splitToken

  const up = async (onExotError) => {
    await createDirectory(pathLogDirectory)
    upSync(onExotError)
  }
  const upSync = (onExotError) => {
    loggerExot = createSimpleLoggerExot({ ...simpleLoggerOption, pathOutputFile: resolve(pathLogDirectory, getLogFileName()) })
    loggerExot.up(onExotError)
    saveToken = saveInterval ? setInterval(save, saveInterval) : undefined
    splitToken = splitInterval ? setTimeout(split, splitInterval) : undefined
  }
  const down = () => {
    if (isUp() === false) return
    loggerExot.down()
    saveToken !== undefined && clearInterval(saveToken)
    splitToken !== undefined && clearTimeout(splitToken)
    loggerExot = undefined
    saveToken = undefined
    splitToken = undefined
  }
  const isUp = () => loggerExot !== undefined

  const add = (...args) => { loggerExot !== undefined && loggerExot.add(args.join(' ')) }
  const save = () => { loggerExot !== undefined && loggerExot.save() }
  const split = () => {
    if (loggerExot === undefined) return
    down()
    upSync()
  }

  return {
    id, up, down, isUp,
    add, save, split
  }
}

export { createSimpleLoggerExot, createLoggerExot }
