/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Vector2.js
 */

export class Vector2 {
  constructor (x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  set (x, y) {
    this.x = x
    this.y = y
    return this
  }

  setScalar (scalar) {
    this.x = scalar
    this.y = scalar
    return this
  }

  setX (x) {
    this.x = x
    return this
  }

  setY (y) {
    this.y = y
    return this
  }

  setComponent (index, value) {
    switch (index) {
      case 0:
        this.x = value
        break
      case 1:
        this.y = value
        break
      default:
        throw new Error('index is out of range: ' + index)
    }
  }

  getComponent (index) {
    switch (index) {
      case 0:
        return this.x
      case 1:
        return this.y
      default:
        throw new Error('index is out of range: ' + index)
    }
  }

  clone () {
    return new this.constructor(this.x, this.y)
  }

  copy (v) {
    this.x = v.x
    this.y = v.y
    return this
  }

  add (v) {
    this.x += v.x
    this.y += v.y
    return this
  }

  addScalar (s) {
    this.x += s
    this.y += s
    return this
  }

  addVectors (a, b) {
    this.x = a.x + b.x
    this.y = a.y + b.y
    return this
  }

  addScaledVector (v, s) {
    this.x += v.x * s
    this.y += v.y * s
    return this
  }

  sub (v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  subScalar (s) {
    this.x -= s
    this.y -= s
    return this
  }

  subVectors (a, b) {
    this.x = a.x - b.x
    this.y = a.y - b.y
    return this
  }

  multiply (v) {
    this.x *= v.x
    this.y *= v.y
    return this
  }

  multiplyScalar (scalar) {
    if (isFinite(scalar)) {
      this.x *= scalar
      this.y *= scalar
    } else {
      this.x = 0
      this.y = 0
    }
    return this
  }

  divide (v) {
    this.x /= v.x
    this.y /= v.y
    return this
  }

  divideScalar (scalar) {
    return this.multiplyScalar(1 / scalar)
  }

  min (v) {
    this.x = Math.min(this.x, v.x)
    this.y = Math.min(this.y, v.y)
    return this
  }

  max (v) {
    this.x = Math.max(this.x, v.x)
    this.y = Math.max(this.y, v.y)
    return this
  }

  clamp (min, max) {
    // This function assumes min < max, if this assumption isn't true it will not operate correctly
    this.x = Math.max(min.x, Math.min(max.x, this.x))
    this.y = Math.max(min.y, Math.min(max.y, this.y))
    return this
  }

  clampScalar (minVal, maxVal) {
    const min = BUFFER_VECTOR2_0
    const max = BUFFER_VECTOR2_1
    min.set(minVal, minVal)
    max.set(maxVal, maxVal)
    return this.clamp(min, max)
  }

  clampLength (min, max) {
    const length = this.length()
    this.multiplyScalar(Math.max(min, Math.min(max, length)) / length)
    return this
  }

  floor () {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    return this
  }

  ceil () {
    this.x = Math.ceil(this.x)
    this.y = Math.ceil(this.y)
    return this
  }

  round () {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    return this
  }

  roundToZero () {
    this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x)
    this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y)
    return this
  }

  negate () {
    this.x = -this.x
    this.y = -this.y
    return this
  }

  dot (v) {
    return this.x * v.x + this.y * v.y
  }

  lengthSquared () {
    return this.x * this.x + this.y * this.y
  }

  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  lengthManhattan () {
    return Math.abs(this.x) + Math.abs(this.y)
  }

  normalize () {
    return this.divideScalar(this.length())
  }

  angle () {
    // computes the angle in radians with respect to the positive x-axis
    let angle = Math.atan2(this.y, this.x)
    if (angle < 0) angle += 2 * Math.PI
    return angle
  }

  distanceTo (v) {
    const dx = this.x - v.x
    const dy = this.y - v.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  distanceToSquared (v) {
    const dx = this.x - v.x
    const dy = this.y - v.y
    return dx * dx + dy * dy
  }

  setLength (length) {
    return this.multiplyScalar(length / this.length())
  }

  lerp (v, alpha) {
    this.x += (v.x - this.x) * alpha
    this.y += (v.y - this.y) * alpha
    return this
  }

  lerpVectors (v1, v2, alpha) {
    this.x = (v2.x - v1.x) * alpha + v1.x
    this.y = (v2.y - v1.y) * alpha + v1.y
    return this
  }

  equals (v) {
    return v.x === this.x && v.y === this.y
  }

  fromArray (array, offset = 0) {
    this.x = array[ offset ]
    this.y = array[ offset + 1 ]
    return this
  }

  toArray (array = [], offset = 0) {
    array[ offset ] = this.x
    array[ offset + 1 ] = this.y
    return array
  }

  rotateAround (center, angle) {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const x = this.x - center.x
    const y = this.y - center.y
    this.x = x * c - y * s + center.x
    this.y = x * s + y * c + center.y
    return this
  }
}

const BUFFER_VECTOR2_0 = new Vector2()
const BUFFER_VECTOR2_1 = new Vector2()
