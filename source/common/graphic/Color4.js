/*
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Color.js
 */

import { systemEndianness } from 'source/env'
import { euclideanModulo, clamp } from 'source/common/math'
import { hue2rgb } from './__utils__'

export class Color4 {
  constructor (r, g, b, a) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  getUint32 = systemEndianness === 'little'
    ? function () { return ((this.r * 255) << 0) + ((this.g * 255) << 8) + ((this.b * 255) << 16) + ((this.a * 255) << 24) } // little endian
    : function () { return ((this.r * 255) << 24) + ((this.g * 255) << 16) + ((this.b * 255) << 8) + ((this.a * 255) << 0) } // big endian

  setScalar (scalar) {
    this.r = scalar
    this.g = scalar
    this.b = scalar
    this.a = scalar
  }

  setHex (hex) {
    hex = Math.floor(hex)
    this.r = ((hex >>> 24) & 255) / 255
    this.g = ((hex >>> 16) & 255) / 255
    this.b = ((hex >>> 8) & 255) / 255
    this.a = (hex & 255) / 255
    return this
  }

  setRGBA (r, g, b, a) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
    return this
  }

  setHSLA (h, s, l, a) {
    // h,s,l, a ranges are in 0.0 - 1.0
    h = euclideanModulo(h, 1)
    s = clamp(s, 0, 1)
    l = clamp(l, 0, 1)
    a = clamp(a, 0, 1)
    if (s === 0) {
      this.r = this.g = this.b = this.a = l
    } else {
      const p = l <= 0.5 ? l * (1 + s) : l + s - l * s
      const q = 2 * l - p
      this.r = hue2rgb(q, p, h + 1 / 3)
      this.g = hue2rgb(q, p, h)
      this.b = hue2rgb(q, p, h - 1 / 3)
      this.a = a
    }
    return this
  }

  clone () {
    return new this.constructor(this.r, this.g, this.b, this.a)
  }

  copy (color) {
    this.r = color.r
    this.g = color.g
    this.b = color.b
    this.a = color.a
    return this
  }

  copyGammaToLinear (color, gammaFactor) {
    if (gammaFactor === undefined) gammaFactor = 2.0
    this.r = Math.pow(color.r, gammaFactor)
    this.g = Math.pow(color.g, gammaFactor)
    this.b = Math.pow(color.b, gammaFactor)
    this.a = Math.pow(color.a, gammaFactor)
    return this
  }

  copyLinearToGamma (color, gammaFactor) {
    if (gammaFactor === undefined) gammaFactor = 2.0
    const safeInverse = gammaFactor > 0 ? 1.0 / gammaFactor : 1.0
    this.r = Math.pow(color.r, safeInverse)
    this.g = Math.pow(color.g, safeInverse)
    this.b = Math.pow(color.b, safeInverse)
    this.a = Math.pow(color.a, safeInverse)
    return this
  }

  convertGammaToLinear () {
    const { r, g, b, a } = this
    this.r = r * r
    this.g = g * g
    this.b = b * b
    this.a = a * a
    return this
  }

  convertLinearToGamma () {
    this.r = Math.sqrt(this.r)
    this.g = Math.sqrt(this.g)
    this.b = Math.sqrt(this.b)
    this.a = Math.sqrt(this.a)
    return this
  }

  getHex () {
    return ((this.r * 255) << 24) ^ ((this.g * 255) << 16) ^ ((this.b * 255) << 8) ^ ((this.a * 255) << 0)
  }

  getHexString () {
    return ('00000000' + this.getHex().toString(16)).slice(-8)
  }

  getHSLA (optionalTarget) {
    const { r, g, b, a } = this
    const hsla = optionalTarget || { h: 0, s: 0, l: 0, a: 0 } // h,s,l,a ranges are in 0.0 - 1.0
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let hue, saturation
    const lightness = (min + max) / 2.0
    if (min === max) {
      hue = 0
      saturation = 0
    } else {
      const delta = max - min
      saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min)
      switch (max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0)
          break
        case g:
          hue = (b - r) / delta + 2
          break
        case b:
          hue = (r - g) / delta + 4
          break
      }
      hue /= 6
    }
    hsla.h = hue
    hsla.s = saturation
    hsla.l = lightness
    hsla.a = a
    return hsla
  }

  offsetHSLA (h, s, l, a) {
    const hsla = this.getHSLA()
    hsla.h += h
    hsla.s += s
    hsla.l += l
    hsla.a += a
    this.setHSLA(hsla.h, hsla.s, hsla.l, hsla.a)
    return this
  }

  add (color) {
    this.r += color.r
    this.g += color.g
    this.b += color.b
    this.a += color.a
    return this
  }

  addColors (color1, color2) {
    this.r = color1.r + color2.r
    this.g = color1.g + color2.g
    this.b = color1.b + color2.b
    this.a = color1.a + color2.a
    return this
  }

  addScalar (s) {
    this.r += s
    this.g += s
    this.b += s
    this.a += s
    return this
  }

  multiply (color) {
    this.r *= color.r
    this.g *= color.g
    this.b *= color.b
    this.a *= color.a
    return this
  }

  multiplyScalar (s) {
    this.r *= s
    this.g *= s
    this.b *= s
    this.a *= s
    return this
  }

  lerp (color, alpha) {
    this.r += (color.r - this.r) * alpha
    this.g += (color.g - this.g) * alpha
    this.b += (color.b - this.b) * alpha
    this.a += (color.a - this.a) * alpha
    return this
  }

  equals (c) {
    return c.r === this.r && c.g === this.g && c.b === this.b && c.a === this.a
  }

  fromArray (array, offset) {
    if (offset === undefined) offset = 0
    this.r = array[ offset ]
    this.g = array[ offset + 1 ]
    this.b = array[ offset + 2 ]
    this.a = array[ offset + 3 ]
    return this
  }

  toArray (array, offset) {
    if (array === undefined) array = []
    if (offset === undefined) offset = 0
    array[ offset ] = this.r
    array[ offset + 1 ] = this.g
    array[ offset + 2 ] = this.b
    array[ offset + 3 ] = this.a
    return array
  }
}
