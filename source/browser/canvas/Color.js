import { getEndianness } from 'source/env/function.js'

// operation

// the uint32 should come from canvas imageData buffer, thus the endianness check
const uint32FromRgba = getEndianness() === 'little'
  ? (R, G, B, A) => ( // little endian
    R +
    (G << 8) +
    (B << 16) +
    (A << 24)
  )
  : (R, G, B, A) => ( // big endian
    A +
    (B << 8) +
    (G << 16) +
    (R << 24)
  )
const rgbaFromUint32 = getEndianness() === 'little'
  ? (value) => ({ // little endian
    r: value & 0x000000ff,
    g: (value & 0x0000ff00) >> 8,
    b: (value & 0x00ff0000) >> 16,
    a: (value & 0xff000000) >> 24
  })
  : (value) => ({ // big endian
    a: value & 0x000000ff,
    b: (value & 0x0000ff00) >> 8,
    g: (value & 0x00ff0000) >> 16,
    r: (value & 0xff000000) >> 24
  })

const toHex2 = (number) => number.toString(16).padStart(2, '0')
const hexCSSFromRgba = (R, G, B, A) => `#${toHex2(R)}${toHex2(G)}${toHex2(B)}${toHex2(A)}`.toUpperCase()
const hexCSSFromRgb = (R, G, B) => `#${toHex2(R)}${toHex2(G)}${toHex2(B)}`.toUpperCase()

export {
  uint32FromRgba,
  rgbaFromUint32,
  hexCSSFromRgba,
  hexCSSFromRgb
}
