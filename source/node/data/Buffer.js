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

// TODO: NOTE: the `buffer, byteOffset, byteLength` are inner buffer attributes
// NOTE: slice: for small Buffers are views on a shared ArrayBuffer.
const toArrayBuffer = ({ buffer, byteOffset, byteLength }) => buffer.slice(byteOffset, byteOffset + byteLength)

export {
  receiveBufferAsync,
  sendBufferAsync,
  toArrayBuffer
}
