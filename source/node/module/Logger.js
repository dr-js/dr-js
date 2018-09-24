import { resolve } from 'path'
import { createLogQueue } from 'source/node/data/LogQueue'
import { createDirectory } from 'source/node/file/File'
import { createSafeWriteStream } from './SafeWrite'

const createSimpleLogger = ({ queueLengthThreshold, ...extraOption }) => createLogQueue({
  outputStream: createSafeWriteStream(extraOption),
  queueLengthThreshold
})

const SAVE_INTERVAL = 30 * 1000 // in ms, 30sec
const SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // in ms, 24day

const createLogger = async ({
  pathLogDirectory,
  prefixLogFile = '', // TODO: DEPRECATE, use `getLogFileName`
  getLogFileName = () => `${prefixLogFile}${(new Date().toISOString()).replace(/\W/g, '-')}.log`,
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
    logger = null
    saveToken = null
    splitToken = null
  }

  await createDirectory(pathLogDirectory)
  reset()

  return { add, save, split, end }
}

export { createSimpleLogger, createLogger }
