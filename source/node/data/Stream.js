const pipeStreamAsync = (writableStream, readableStream) => new Promise((resolve, reject) => {
  readableStream.on('error', reject)
  readableStream.on('end', () => {
    readableStream.removeListener('error', reject)
    resolve()
  })
  readableStream.pipe(writableStream)
})

export {
  pipeStreamAsync
}
