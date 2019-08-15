import { Readable } from 'stream'

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

export {
  pipeStreamAsync,
  bufferToReadableStream
}
