import { resolve } from 'path'
import { createLogQueue } from 'source/node/data/LogQueue'
import { createDirectory } from 'source/node/file/File'
import { createSafeWriteStream } from './SafeWrite'

const createSimpleLogger = ({ queueLengthThreshold, ...extraOption }) => createLogQueue({
  outputStream: createSafeWriteStream(extraOption),
  queueLengthThreshold
})

const AUTO_SAVE_TIME = 5 * 60 * 1000 // in ms, 5min
const AUTO_SPLIT_TIME = 24 * 60 * 60 * 1000 // in ms, 24day

const createLogger = async ({
  pathLogDirectory,
  prefixLogFile = '',
  getLogFileName = () => `${prefixLogFile}${(new Date().toISOString()).replace(/\W/g, '-')}.log`,
  autoSaveInterval = AUTO_SAVE_TIME, // TODO: rename to `saveInterval`
  fileSplitInterval = AUTO_SPLIT_TIME, // TODO: rename to `splitInterval`
  ...extraOption
}) => {
  let logger
  let saveToken
  let splitToken

  const reset = () => {
    end()
    const pathOutputFile = resolve(pathLogDirectory, getLogFileName())
    logger = createSimpleLogger({ ...extraOption, pathOutputFile })
    saveToken = autoSaveInterval && setInterval(save, autoSaveInterval)
    splitToken = fileSplitInterval && setTimeout(split, fileSplitInterval)
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
