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

// NOTE: slice: for small Buffers are views on a shared ArrayBuffer.
// https://github.com/nodejs/node/issues/3580
const toArrayBuffer = (buffer) => {
  const { buffer: arrayBuffer, byteOffset, byteLength } = buffer
  return arrayBuffer.byteLength === byteLength
    ? arrayBuffer
    : arrayBuffer.slice(byteOffset, byteOffset + byteLength)
}

export {
  receiveBufferAsync,
  sendBufferAsync,
  toArrayBuffer
}
