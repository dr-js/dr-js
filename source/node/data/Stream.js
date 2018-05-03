import { Duplex } from 'stream'

const pipeStreamAsync = (writableStream, readableStream) => new Promise((resolve, reject) => {
  readableStream.on('error', reject)
  readableStream.on('end', () => {
    readableStream.removeListener('error', reject)
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
