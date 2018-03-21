const receiveBufferAsync = (readableStream) => new Promise((resolve, reject) => {
  const data = []
  readableStream.on('error', reject)
  readableStream.on('data', (chunk) => data.push(chunk))
  readableStream.on('end', () => {
    readableStream.removeListener('error', reject)
    resolve(Buffer.concat(data))
  })
})

const sendBufferAsync = (writableStream, buffer) => new Promise((resolve, reject) => {
  writableStream.on('error', reject)
  writableStream.write(buffer, () => {
    writableStream.removeListener('error', reject)
    resolve()
  })
})

export {
  receiveBufferAsync,
  sendBufferAsync
}
