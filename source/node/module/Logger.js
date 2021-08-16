import { resolve } from 'path'
import { createDirectory } from 'source/node/fs/Directory.js'
import { createSafeWriteStream } from './SafeWrite.js'

const DEFAULT_QUEUE_LENGTH_THRESHOLD = __DEV__ ? 10 : 1024

// support `add()` before `up()`
const createSimpleLoggerExot = ({
  id = 'exot:logger-simple',
  queueLengthThreshold = DEFAULT_QUEUE_LENGTH_THRESHOLD,
  ...safeWriteStreamOption
}) => {
  const logQueue = [] // buffered log
  let safeWriteStream

  const up = (onExotError) => {
    if (isUp() === true) throw new Error('already up')
    safeWriteStream = createSafeWriteStream({ onError: onExotError, ...safeWriteStreamOption })
  }
  const down = () => {
    if (isUp() === false) return
    save()
    // logQueue = [] // save should flush all pending logs
    safeWriteStream.end()
    safeWriteStream = undefined
  }
  const isUp = () => safeWriteStream !== undefined

  const add = (logString) => { // allow single string only, will trigger save on threshold
    logQueue.push(logString)
    logQueue.length > queueLengthThreshold && save()
  }
  const save = () => {
    if (isUp() === false || logQueue.length === 0) return
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

// support `add()` before `up()`
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
  const getLoggerExot = () => createSimpleLoggerExot({ ...simpleLoggerOption, pathOutputFile: resolve(pathLogDirectory, getLogFileName()) })

  let loggerExot = getLoggerExot()
  let saveToken
  let splitToken

  const upSync = (onExotError) => {
    loggerExot.up(onExotError)
    saveToken = saveInterval ? setInterval(save, saveInterval) : undefined
    splitToken = splitInterval ? setTimeout(split, splitInterval) : undefined // will reset on split, so timeout is enough
  }

  const up = async (onExotError) => {
    if (isUp() === true) throw new Error('already up')
    await createDirectory(pathLogDirectory)
    upSync(onExotError)
  }
  const down = () => {
    if (isUp() === false) return
    loggerExot.down()
    saveToken !== undefined && clearInterval(saveToken)
    splitToken !== undefined && clearTimeout(splitToken)
    loggerExot = getLoggerExot()
    saveToken = undefined
    splitToken = undefined
  }
  const isUp = () => loggerExot.isUp()

  const add = (...args) => { loggerExot.add(args.join(' ')) }
  const save = () => { loggerExot.save() }
  const split = () => {
    if (isUp() === false) return
    down()
    upSync()
  }

  return {
    id, up, down, isUp,
    add, save, split
  }
}

export { createSimpleLoggerExot, createLoggerExot }
