import nodeModulePath from 'path'
import { createLogQueue } from 'source/common/data'
import { getRandomId } from 'source/common/math'
import { createDirectory } from 'source/node/file'
import { createSafeWriteStream } from './SafeWrite'

const createSimpleLogger = ({ pathOutputFile, onError, queueLengthThreshold }) => createLogQueue({
  outputStream: createSafeWriteStream({ pathOutputFile, onError }),
  queueLengthThreshold
})

const FILE_SPLIT_INTERVAL = 24 * 60 * 60 * 1000 // 24hour

const createLogger = async ({
  pathLogDirectory,
  prefixLogFile = '',
  queueLengthThreshold,
  fileSplitInterval = FILE_SPLIT_INTERVAL,
  onError
}) => {
  await createDirectory(pathLogDirectory)
  let logger = null
  const splitLogFile = () => {
    logger && logger.end()
    logger = createSimpleLogger({ pathOutputFile: nodeModulePath.join(pathLogDirectory, `${prefixLogFile}${getRandomId()}.log`), queueLengthThreshold, onError })
  }
  splitLogFile()
  let intervalToken = setInterval(splitLogFile, fileSplitInterval)
  return {
    add: (...args) => logger && logger.add(...args),
    save: () => logger && logger.save(),
    split: splitLogFile,
    end: () => {
      intervalToken && clearInterval(intervalToken) && (intervalToken = null)
      logger && logger.end() && (logger = null)
    }
  }
}

export { createLogger, createSimpleLogger }
