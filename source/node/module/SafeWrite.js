import nodeModuleFs from 'fs'

// async write normally, sync write on emergency
const createSafeWriteStream = ({ pathOutputFile, onError = DEFAULT_ON_ERROR, flag = 'w', mode = 0o666 }) => {
  let fileDescriptor = nodeModuleFs.openSync(pathOutputFile, flag, mode)
  let writingQueue = []
  let pendingQueue = []
  const onWriteError = (error) => error ? onError(error) : (writingQueue.length = 0)
  const doWrite = (string) => fileDescriptor && nodeModuleFs.write(fileDescriptor, string, onWriteError)
  const write = (writeString) => {
    if (!writeString) return
    pendingQueue.push(writeString)
    if (writingQueue.length !== 0) return
    [ writingQueue, pendingQueue ] = [ pendingQueue, [] ]
    process.nextTick(doWrite, writingQueue.join(''))
  }
  const end = () => {
    const remainQueue = [ ...writingQueue, ...pendingQueue ]
    remainQueue.length !== 0 && nodeModuleFs.writeSync(fileDescriptor, remainQueue.join(''))
    nodeModuleFs.closeSync(fileDescriptor)
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
