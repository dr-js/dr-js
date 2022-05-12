import { randomFill, createHash } from 'crypto'
import { promisify } from 'util'

const randomFillAsync = promisify(randomFill)

// in bytes
const getRandomBufferAsync = (size) => randomFillAsync(Buffer.allocUnsafe(size))

const calcHash = (
  bufferOrString,
  algorithm = 'sha1', // for speed: https://security.stackexchange.com/questions/95696/which-hash-algorithm-takes-longer-time-if-we-compare-between-md5-or-sha256/95697#95697
  encoding = 'base64' // set to 'buffer' for buffer result
) => createHash(algorithm).update(bufferOrString).digest(encoding)

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
  getRandomBufferAsync,
  calcHash,
  createBufferRefragPool
}
