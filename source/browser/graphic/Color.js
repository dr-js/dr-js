import { getEndianness } from 'source/env'

// operation
const getUint32RGBA = getEndianness() === 'little'
  ? (r, g, b, a) => ( // little endian
    r +
    (g << 8) +
    (b << 16) +
    (a << 24)
  )
  : (r, g, b, a) => ( // big endian
    a +
    (b << 8) +
    (g << 16) +
    (r << 24)
  )
const getRGBAFromUint32RGBA = getEndianness() === 'little'
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

const getHexFromRGBA = (r, g, b, a) => `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`.toUpperCase()
const getHexFromRGB = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
const toHex = (value) => {
  const hexString = value.toString(16)
  return hexString.length > 1 ? hexString : `0${hexString}`
}

export {
  getUint32RGBA,
  getRGBAFromUint32RGBA,
  getHexFromRGBA,
  getHexFromRGB
}
