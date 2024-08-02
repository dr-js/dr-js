import { openSync, write, writeSync, closeSync } from 'node:fs'
import { rethrowError } from 'source/common/error.js'

/** @import { OpenMode, Mode } from 'node:fs' */

/** @typedef { { pathOutputFile: string, flag?: OpenMode, mode?: Mode, fileDescriptor?: number, onError?: (error: Error) => never } } OptCreateSafeWriteStream */

// async write normally, sync write on emergency
/** @type { (opt: OptCreateSafeWriteStream) => { write: (string: string) => void, end: () => void } } } */
const createSafeWriteStream = ({
  pathOutputFile, flag = 'w', mode = 0o666,
  fileDescriptor = openSync(pathOutputFile, flag, mode),
  onError = rethrowError
}) => {
  let writingQueue = []
  let pendingQueue = []
  const onWriteDone = (error) => error ? onError(error) : (writingQueue.length = 0)
  const doWrite = (string) => fileDescriptor !== undefined && write(fileDescriptor, string, onWriteDone)
  return {
    write: (string) => {
      if (!string) return
      pendingQueue.push(string)
      if (writingQueue.length !== 0) return
      [ writingQueue, pendingQueue ] = [ pendingQueue, [] ]
      process.nextTick(doWrite, writingQueue.join(''))
    },
    end: () => {
      const remainQueue = [ ...writingQueue, ...pendingQueue ]
      remainQueue.length !== 0 && writeSync(fileDescriptor, remainQueue.join(''))
      closeSync(fileDescriptor)
      fileDescriptor = undefined
      pendingQueue.length = writingQueue.length = 0
    }
  }
}

export { createSafeWriteStream }
