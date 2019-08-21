import { Readable } from 'stream'
import { createInterface } from 'readline'

// TODO: should also check event from writableStream
const pipeStreamAsync = (writableStream, readableStream) => new Promise((resolve, reject) => {
  readableStream.on('error', reject)
  readableStream.on('end', () => {
    readableStream.off('error', reject)
    resolve()
  })
  readableStream.pipe(writableStream)
})

const bufferToReadableStream = (buffer) => {
  const readableStream = new Readable()
  readableStream.push(buffer)
  readableStream.push(null)
  return readableStream
}

// TODO: not able to pause & resume the line-reading to run some async code
const createReadlineFromStreamAsync = (readStream, onLineSync) => new Promise((resolve, reject) => {
  const readlineInterface = createInterface({ input: readStream, historySize: 0, crlfDelay: Infinity })
  readlineInterface.on('error', (error) => { // TODO: this is not documented, don't know if this will be called or not
    __DEV__ && console.log(`[Readline] error`, error)
    readlineInterface.close()
    reject(error)
  })
  readlineInterface.on('close', () => {
    __DEV__ && console.log(`[Readline] close`)
    resolve()
  })
  readlineInterface.on('line', (line) => {
    __DEV__ && console.log(`[Readline] line: ${line}`)
    onLineSync(line)
  })
})

export {
  pipeStreamAsync,
  bufferToReadableStream,
  createReadlineFromStreamAsync
}
