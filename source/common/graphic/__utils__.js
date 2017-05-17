import { systemEndianness } from 'source/env'

const hue2rgb = (p, q, t) => { // TODO: not really, just one common step
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t)
  return p
}

const rgbaToUint32 = systemEndianness === 'little'
  ? function () { return ((this.r * 255) << 0) + ((this.g * 255) << 8) + ((this.b * 255) << 16) + ((this.a * 255) << 24) } // little endian
  : function () { return ((this.r * 255) << 24) + ((this.g * 255) << 16) + ((this.b * 255) << 8) + ((this.a * 255) << 0) } // big endian

export {
  hue2rgb,
  rgbaToUint32
}
