import { randomFill } from 'crypto'
import { promisify } from 'util'

const randomFillAsync = promisify(randomFill)

const toArrayBuffer = (buffer) => {
  // NOTE: slice: for small Buffers are views on a shared ArrayBuffer.
  // https://github.com/nodejs/node/issues/3580
  const { buffer: arrayBuffer, byteOffset, byteLength } = buffer
  return arrayBuffer.byteLength === byteLength
    ? arrayBuffer
    : arrayBuffer.slice(byteOffset, byteOffset + byteLength)
}

// in bytes
const getRandomBufferAsync = (size) => randomFillAsync(Buffer.allocUnsafe(size))

export {
  toArrayBuffer,
  getRandomBufferAsync
}
