import { Duplex } from 'stream'

// TODO: should also check event from writableStream
const pipeStreamAsync = (writableStream, readableStream) => new Promise((resolve, reject) => {
  readableStream.on('error', reject)
  readableStream.on('end', () => {
    readableStream.off('error', reject)
    resolve()
  })
  readableStream.pipe(writableStream)
})

const bufferToStream = (buffer) => {
  const stream = new Duplex()
  stream.push(buffer)
  stream.push(null)
  return stream
}

export {
  pipeStreamAsync,
  bufferToStream
}
