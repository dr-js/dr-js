import nodeModuleFs from 'fs'

// TODO: almost safe to use, check test for exceptions

// async write normally, sync write on emergency
const createSafeWriteStream = ({ pathOutputFile, onError = DEFAULT_ON_ERROR, flags = 'a', mode = 0o666 }) => {
  let fileDescriptor = nodeModuleFs.openSync(pathOutputFile, flags, mode)
  let writingQueue = []
  let pendingQueue = []
  const write = (writeString) => {
    if (!writeString) return
    pendingQueue.push(writeString)
    if (writingQueue.length !== 0) return
    [ writingQueue, pendingQueue ] = [ pendingQueue, [] ]
    nodeModuleFs.write(fileDescriptor, writingQueue.join(''), (error) => (fileDescriptor && error) ? onError(error) : (writingQueue.length = 0))
  }
  const end = () => {
    pendingQueue.length !== 0 && nodeModuleFs.writeSync(fileDescriptor, pendingQueue.join('')) // TODO: TEST: no need to rewrite writingQueue
    process.nextTick((fileDescriptor) => nodeModuleFs.closeSync(fileDescriptor), fileDescriptor)
    fileDescriptor = null
    pendingQueue.length = writingQueue.length = 0
  }
  return { write, end }
}

const DEFAULT_ON_ERROR = (error) => {
  console.warn(error)
  throw error
}

export { createSafeWriteStream }
