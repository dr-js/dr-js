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

const createBufferRefragPool = () => { // push smaller buffer frag, shift resized buffer frag
  const pool = []
  let poolSumLength = 0

  const pushFrag = (bufferFrag) => {
    pool.push(bufferFrag)
    poolSumLength += bufferFrag.length
  }

  const hasLength = (length) => (poolSumLength >= length)

  const tryGetRefragBuffer = (length) => {
    if (poolSumLength < length) return // not enough yet

    poolSumLength -= length

    if (length === pool[ 0 ].length) { // frag size just fit
      return pool.shift()
    }

    if (length < pool[ 0 ].length) { // frag bigger than merged buffer
      const buffer = pool[ 0 ].slice(0, length)
      pool[ 0 ] = pool[ 0 ].slice(length)
      return buffer
    }

    { // merge multiple frag
      const buffer = Buffer.allocUnsafe(length)
      let offset = 0
      while (length > 0) {
        const frag = pool[ 0 ]
        const fragLength = frag.length
        if (length >= fragLength) { // add frag
          frag.copy(buffer, offset)
          pool.shift()
          offset += fragLength
          length -= fragLength
        } else { // add part of frag
          frag.copy(buffer, offset, 0, length)
          pool[ 0 ] = frag.slice(length)
          length = 0
        }
      }
      return buffer
    }
  }

  return {
    pushFrag,
    hasLength,
    tryGetRefragBuffer
  }
}

export {
  toArrayBuffer,
  getRandomBufferAsync,
  createBufferRefragPool
}
