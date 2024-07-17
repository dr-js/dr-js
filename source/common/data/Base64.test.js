import { stringifyEqual } from 'source/common/verify.js'
import { createStepper } from 'source/common/time.js'
import { time } from 'source/common/format.js'
import { isEqualArrayBuffer } from 'source/common/data/ArrayBuffer.js'
import { encode, decode } from './Base64.js'

const { describe, it, info = console.log } = globalThis

const stringArrayBuffer = (string = '') => {
  const u8List = new Uint8Array(string.length)
  for (let i = 0; i < string.length; i++) u8List[ i ] = string.charCodeAt(i)
  return u8List.buffer
}

const generateArrayBuffer = (length = 256) => {
  const u8List = new Uint8Array(length)
  for (let i = 0; i < length; i++) u8List[ i ] = i % 256
  return u8List.buffer
}

/** @type { [ note: string, arrayBuffer: ArrayBuffer, b64String: string ][] } */
const SAMPLE_LIST = [ // from: https://github.com/niklasvh/base64-arraybuffer/blob/master/test/base64-arraybuffer_test.js
  // [ note, arrayBuffer, b64String ]
  [ 'Man', stringArrayBuffer('Man'), 'TWFu' ],
  [ 'Ma', stringArrayBuffer('Ma'), 'TWE=' ],
  [ 'Hello worlds!', stringArrayBuffer('Hello worlds!'), 'SGVsbG8gd29ybGRzIQ==' ],
  [ 'Hello world', stringArrayBuffer('Hello world'), 'SGVsbG8gd29ybGQ=' ],
  [ 'all 256 uint8', generateArrayBuffer(256), 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==' ]
]

describe('Common.Data.Base64', () => {
  it('encode()', () => {
    for (const [ note, arrayBuffer, b64String ] of SAMPLE_LIST) {
      stringifyEqual(encode(arrayBuffer), b64String, `should encode: ${note}`)
    }
  })

  it('decode()', () => {
    for (const [ note, arrayBuffer, b64String ] of SAMPLE_LIST) {
      stringifyEqual(isEqualArrayBuffer(decode(b64String), arrayBuffer), true, `should decode: ${note}`)
    }
  })

  it('stress', () => { // from: https://github.com/beatgammit/base64-js/blob/master/test/big-data.js
    // for less optimized code, could run ~20sec or just OOM, now should run 1~2sec
    const stepper = createStepper()
    const arrayBuffer = generateArrayBuffer(64 * 1024 * 1024) // 64MiB data
    info('done build data', time(stepper()))
    const b64String = encode(arrayBuffer)
    info('encode data', time(stepper()))
    const arrayBufferDecoded = decode(b64String)
    info('decode data', time(stepper()))
    stringifyEqual(isEqualArrayBuffer(arrayBufferDecoded, arrayBuffer), true)
  })
})
