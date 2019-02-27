const receiveBufferAsync = (readableStream) => new Promise((resolve, reject) => {
  const data = []
  readableStream.on('error', reject)
  readableStream.on('data', (chunk) => data.push(chunk))
  readableStream.on('end', () => {
    readableStream.off('error', reject)
    resolve(Buffer.concat(data))
  })
})

const sendBufferAsync = (writableStream, buffer) => new Promise((resolve, reject) => {
  if (buffer.length === 0) return resolve() // for ServerResponse the callback will miss if the chunk is non-empty. https://nodejs.org/api/http.html#http_request_write_chunk_encoding_callback
  writableStream.on('error', reject)
  writableStream.write(buffer, () => {
    writableStream.off('error', reject)
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
