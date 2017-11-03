import { createLogQueue } from 'source/common/data'
import { createSafeWriteStream } from './SafeWrite'

const createLogger = ({ queueLengthThreshold, pathOutputFile, onError }) => createLogQueue({
  queueLengthThreshold,
  outputStream: createSafeWriteStream({ pathOutputFile, onError })
})

export { createLogger }
