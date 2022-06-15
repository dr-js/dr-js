import { B86_ZERO, encode as encodeB86, decode as decodeB86 } from './B86.js'

const __V = new DataView(new Float32Array(1).buffer) // use big-endian (the default)

/** @type { (value: number) => number } */
const cast = (value) => {
  __V.setFloat32(0, value)
  return __V.getFloat32(0)
}

// F32: 5-char B86, enough to keep Float32 data

/** @type { (float32: number) => string } */
const encodeF32 = (float32) => {
  __V.setFloat32(0, float32)
  return encodeB86(__V.getUint32(0)).padStart(5, B86_ZERO)
}

/** @type { (string: string) => number } */
const decodeF32 = (string) => {
  __V.setUint32(0, decodeB86(string))
  return __V.getFloat32(0)
}

export {
  cast,
  encodeF32,
  decodeF32
}
