/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js
 */

export class Vector3 {
  constructor (x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  set (x, y, z) {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  setScalar (scalar) {
    this.x = scalar
    this.y = scalar
    this.z = scalar
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

  setZ (z) {
    this.z = z
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
      case 2:
        this.z = value
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
      case 2:
        return this.z
      default:
        throw new Error('index is out of range: ' + index)
    }
  }

  clone () {
    return new this.constructor(this.x, this.y, this.z)
  }

  copy (v) {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    return this
  }

  add (v) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }

  addScalar (s) {
    this.x += s
    this.y += s
    this.z += s
    return this
  }

  addVectors (a, b) {
    this.x = a.x + b.x
    this.y = a.y + b.y
    this.z = a.z + b.z
    return this
  }

  addScaledVector (v, s) {
    this.x += v.x * s
    this.y += v.y * s
    this.z += v.z * s
    return this
  }

  sub (v) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }

  subScalar (s) {
    this.x -= s
    this.y -= s
    this.z -= s
    return this
  }

  subVectors (a, b) {
    this.x = a.x - b.x
    this.y = a.y - b.y
    this.z = a.z - b.z
    return this
  }

  multiply (v) {
    this.x *= v.x
    this.y *= v.y
    this.z *= v.z
    return this
  }

  multiplyScalar (scalar) {
    if (isFinite(scalar)) {
      this.x *= scalar
      this.y *= scalar
      this.z *= scalar
    } else {
      this.x = 0
      this.y = 0
      this.z = 0
    }
    return this
  }

  multiplyVectors (a, b) {
    this.x = a.x * b.x
    this.y = a.y * b.y
    this.z = a.z * b.z
    return this
  }

  divide (v) {
    this.x /= v.x
    this.y /= v.y
    this.z /= v.z
    return this
  }

  divideScalar (scalar) {
    return this.multiplyScalar(1 / scalar)
  }

  min (v) {
    this.x = Math.min(this.x, v.x)
    this.y = Math.min(this.y, v.y)
    this.z = Math.min(this.z, v.z)
    return this
  }

  max (v) {
    this.x = Math.max(this.x, v.x)
    this.y = Math.max(this.y, v.y)
    this.z = Math.max(this.z, v.z)
    return this
  }

  clamp (min, max) {
    // This function assumes min < max, if this assumption isn't true it will not operate correctly
    this.x = Math.max(min.x, Math.min(max.x, this.x))
    this.y = Math.max(min.y, Math.min(max.y, this.y))
    this.z = Math.max(min.z, Math.min(max.z, this.z))
    return this
  }

  clampScalar (minVal, maxVal) {
    // This function assumes minVal < maxVal, if this assumption isn't true it will not operate correctly
    this.x = Math.max(minVal, Math.min(maxVal, this.x))
    this.y = Math.max(minVal, Math.min(maxVal, this.y))
    this.z = Math.max(minVal, Math.min(maxVal, this.z))
    return this
  }

  clampLength (min, max) {
    const length = this.length()
    this.multiplyScalar(Math.max(min, Math.min(max, length)) / length)
    return this
  }

  floor () {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    this.z = Math.floor(this.z)
    return this
  }

  ceil () {
    this.x = Math.ceil(this.x)
    this.y = Math.ceil(this.y)
    this.z = Math.ceil(this.z)
    return this
  }

  round () {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.z = Math.round(this.z)
    return this
  }

  roundToZero () {
    this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x)
    this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y)
    this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z)
    return this
  }

  negate () {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }

  dot (v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  lengthSquared () {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }

  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  lengthManhattan () {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)
  }

  normalize () {
    return this.divideScalar(this.length())
  }

  setLength (length) {
    return this.multiplyScalar(length / this.length())
  }

  lerp (v, alpha) {
    this.x += (v.x - this.x) * alpha
    this.y += (v.y - this.y) * alpha
    this.z += (v.z - this.z) * alpha
    return this
  }

  lerpVectors (v1, v2, alpha) {
    this.x = (v2.x - v1.x) * alpha + v1.x
    this.y = (v2.y - v1.y) * alpha + v1.y
    this.z = (v2.z - v1.z) * alpha + v1.z
    return this
  }

  cross (v) {
    const { x, y, z } = this
    this.x = y * v.z - z * v.y
    this.y = z * v.x - x * v.z
    this.z = x * v.y - y * v.x
    return this
  }

  crossVectors (a, b) {
    const ax = a.x
    const ay = a.y
    const az = a.z
    const bx = b.x
    const by = b.y
    const bz = b.z
    this.x = ay * bz - az * by
    this.y = az * bx - ax * bz
    this.z = ax * by - ay * bx
    return this
  }

  angleTo (v) {
    const theta = this.dot(v) / Math.sqrt(this.lengthSquared() * v.lengthSquared())
    // clamp, to handle numerical problems
    return Math.acos(Math.max(-1, Math.min(1, theta)))
  }

  distanceToSquared (v) {
    const dx = this.x - v.x
    const dy = this.y - v.y
    const dz = this.z - v.z
    return dx * dx + dy * dy + dz * dz
  }

  distanceTo (v) {
    const dx = this.x - v.x
    const dy = this.y - v.y
    const dz = this.z - v.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  equals (v) {
    return v.x === this.x && v.y === this.y && v.z === this.z
  }

  fromArray (array, offset = 0) {
    this.x = array[ offset ]
    this.y = array[ offset + 1 ]
    this.z = array[ offset + 2 ]
    return this
  }

  toArray (array = [], offset = 0) {
    array[ offset ] = this.x
    array[ offset + 1 ] = this.y
    array[ offset + 2 ] = this.z
    return array
  }

  applyMatrix3 (m) {
    const { x, y, z } = this
    const e = m.elements
    this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z
    this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z
    this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z
    return this
  }

  applyMatrix4 (m) {
    // input: Matrix4 affine matrix
    const { x, y, z } = this
    const e = m.elements
    this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ]
    this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ]
    this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ]
    return this
  }

  applyProjection (m) {
    // input: Matrix4 projection matrix
    const { x, y, z } = this
    const e = m.elements
    const d = 1 / (e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ]) // perspective divide
    this.x = (e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ]) * d
    this.y = (e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ]) * d
    this.z = (e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ]) * d
    return this
  }

  applyQuaternion (q) {
    const { x, y, z } = this
    const qx = q.x
    const qy = q.y
    const qz = q.z
    const qw = q.w
    // calculate quat * vector
    const ix = qw * x + qy * z - qz * y
    const iy = qw * y + qz * x - qx * z
    const iz = qw * z + qx * y - qy * x
    const iw = -qx * x - qy * y - qz * z
    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return this
  }
}
