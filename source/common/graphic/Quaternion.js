/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Quaternion.js
 */

/**
 * A quaternion is a complex number with w as the real part and x, y, z as imaginary parts.
 * If a quaternion represents a rotation then w = cos(theta / 2), where theta is the rotation angle around the axis of the quaternion.
 * The axis v(v1, v2, v3) of a rotation is encoded in a quaternion: **x = v1 sin (theta / 2), y = v2 sin (theta / 2), z = v3 sin (theta / 2)*.
 * If w is 1 then the quaternion defines 0 rotation angle around an undefined axis v = (0,0,0).
 * If w is 0 the quaternion defines a half circle rotation since theta then could be +/- pi.
 * If w is -1 the quaternion defines +/-2pi rotation angle around an undefined axis v = (0,0,0).
 * A quater circle rotation around a single axis causes w to be +/- 0.5 and x/y/z to be +/- 0.5.
 * */

import { Vector3 } from './Vector3'

export class Quaternion {
  constructor (x, y, z, w) {
    this._x = x || 0
    this._y = y || 0
    this._z = z || 0
    this._w = w !== undefined ? w : 1
  }

  get x () {
    return this._x
  }

  set x (value) {
    this._x = value
    this.onChangeCallback()
  }

  get y () {
    return this._y
  }

  set y (value) {
    this._y = value
    this.onChangeCallback()
  }

  get z () {
    return this._z
  }

  set z (value) {
    this._z = value
    this.onChangeCallback()
  }

  get w () {
    return this._w
  }

  set w (value) {
    this._w = value
    this.onChangeCallback()
  }

  set (x, y, z, w) {
    this._x = x
    this._y = y
    this._z = z
    this._w = w
    this.onChangeCallback()
    return this
  }

  clone () {
    return new this.constructor(this._x, this._y, this._z, this._w)
  }

  copy (quaternion) {
    this._x = quaternion.x
    this._y = quaternion.y
    this._z = quaternion.z
    this._w = quaternion.w
    this.onChangeCallback()
    return this
  }

  setFromEuler (x, y, z, update) {
    // http://www.mathworks.com/matlabcentral/fileexchange/
    // 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
    // content/SpinCalc.m
    const c1 = Math.cos(x / 2)
    const c2 = Math.cos(y / 2)
    const c3 = Math.cos(z / 2)
    const s1 = Math.sin(x / 2)
    const s2 = Math.sin(y / 2)
    const s3 = Math.sin(z / 2)
    // order: XYZ
    this._x = s1 * c2 * c3 + c1 * s2 * s3
    this._y = c1 * s2 * c3 - s1 * c2 * s3
    this._z = c1 * c2 * s3 + s1 * s2 * c3
    this._w = c1 * c2 * c3 - s1 * s2 * s3
    if (update !== false) this.onChangeCallback()
    return this
  }

  setFromAxisAngle (axis, angle) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized
    const halfAngle = angle / 2
    const s = Math.sin(halfAngle)
    this._x = axis.x * s
    this._y = axis.y * s
    this._z = axis.z * s
    this._w = Math.cos(halfAngle)
    this.onChangeCallback()
    return this
  }

  setFromRotationMatrix (m) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const te = m.elements
    const m11 = te[ 0 ]
    const m12 = te[ 4 ]
    const m13 = te[ 8 ]
    const m21 = te[ 1 ]
    const m22 = te[ 5 ]
    const m23 = te[ 9 ]
    const m31 = te[ 2 ]
    const m32 = te[ 6 ]
    const m33 = te[ 10 ]
    const trace = m11 + m22 + m33
    let s
    if (trace > 0) {
      s = 0.5 / Math.sqrt(trace + 1.0)
      this._w = 0.25 / s
      this._x = (m32 - m23) * s
      this._y = (m13 - m31) * s
      this._z = (m21 - m12) * s
    } else if (m11 > m22 && m11 > m33) {
      s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33)
      this._w = (m32 - m23) / s
      this._x = 0.25 * s
      this._y = (m12 + m21) / s
      this._z = (m13 + m31) / s
    } else if (m22 > m33) {
      s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33)
      this._w = (m13 - m31) / s
      this._x = (m12 + m21) / s
      this._y = 0.25 * s
      this._z = (m23 + m32) / s
    } else {
      s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22)
      this._w = (m21 - m12) / s
      this._x = (m13 + m31) / s
      this._y = (m23 + m32) / s
      this._z = 0.25 * s
    }
    this.onChangeCallback()
    return this
  }

  setFromUnitVectors (vFrom, vTo) {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized
    let r = vFrom.dot(vTo) + 1
    if (r < EPSILON) {
      r = 0
      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
        BUFFER_VECTOR3_0.set(-vFrom.y, vFrom.x, 0)
      } else {
        BUFFER_VECTOR3_0.set(0, -vFrom.z, vFrom.y)
      }
    } else {
      BUFFER_VECTOR3_0.crossVectors(vFrom, vTo)
    }
    this._x = BUFFER_VECTOR3_0.x
    this._y = BUFFER_VECTOR3_0.y
    this._z = BUFFER_VECTOR3_0.z
    this._w = r
    this.normalize()
    return this
  }

  inverse () {
    this.conjugate().normalize()
    return this
  }

  conjugate () {
    this._x *= -1
    this._y *= -1
    this._z *= -1
    this.onChangeCallback()
    return this
  }

  dot (v) {
    return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w
  }

  lengthSquared () {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w
  }

  length () {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w)
  }

  normalize () {
    let l = this.length()
    if (l === 0) {
      this._x = 0
      this._y = 0
      this._z = 0
      this._w = 1
    } else {
      l = 1 / l
      this._x = this._x * l
      this._y = this._y * l
      this._z = this._z * l
      this._w = this._w * l
    }
    this.onChangeCallback()
    return this
  }

  multiply (q) {
    return this.multiplyQuaternions(this, q)
  }

  multiplyQuaternions (a, b) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
    const qax = a._x
    const qay = a._y
    const qaz = a._z
    const qaw = a._w
    const qbx = b._x
    const qby = b._y
    const qbz = b._z
    const qbw = b._w
    this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby
    this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz
    this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx
    this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz
    this.onChangeCallback()
    return this
  }

  slerp (qb, t) {
    if (t === 0) return this
    if (t === 1) return this.copy(qb)
    const { _x, _y, _z, _w } = this
    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
    let cosHalfTheta = _w * qb._w + _x * qb._x + _y * qb._y + _z * qb._z
    if (cosHalfTheta < 0) {
      this._w = -qb._w
      this._x = -qb._x
      this._y = -qb._y
      this._z = -qb._z
      cosHalfTheta = -cosHalfTheta
    } else {
      this.copy(qb)
    }
    if (cosHalfTheta >= 1.0) {
      this._w = _w
      this._x = _x
      this._y = _y
      this._z = _z
      return this
    }
    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta)
    if (Math.abs(sinHalfTheta) < 0.001) {
      this._w = 0.5 * (_w + this._w)
      this._x = 0.5 * (_x + this._x)
      this._y = 0.5 * (_y + this._y)
      this._z = 0.5 * (_z + this._z)
      return this
    }
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta)
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta
    this._w = _w * ratioA + this._w * ratioB
    this._x = _x * ratioA + this._x * ratioB
    this._y = _y * ratioA + this._y * ratioB
    this._z = _z * ratioA + this._z * ratioB
    this.onChangeCallback()
    return this
  }

  equals (quaternion) {
    return quaternion._x === this._x && quaternion._y === this._y && quaternion._z === this._z && quaternion._w === this._w
  }

  fromArray (array, offset) {
    if (offset === undefined) offset = 0
    this._x = array[ offset ]
    this._y = array[ offset + 1 ]
    this._z = array[ offset + 2 ]
    this._w = array[ offset + 3 ]
    this.onChangeCallback()
    return this
  }

  toArray (array, offset) {
    if (array === undefined) array = []
    if (offset === undefined) offset = 0
    array[ offset ] = this._x
    array[ offset + 1 ] = this._y
    array[ offset + 2 ] = this._z
    array[ offset + 3 ] = this._w
    return array
  }

  onChange (callback) {
    this.onChangeCallback = callback
    return this
  }

  onChangeCallback () {}

  static slerp (qa, qb, qm, t) {
    return qm.copy(qa).slerp(qb, t)
  }

  static slerpFlat (dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t) {
    // fuzz-free, array-based Quaternion SLERP operation
    let x0 = src0[ srcOffset0 + 0 ]
    let y0 = src0[ srcOffset0 + 1 ]
    let z0 = src0[ srcOffset0 + 2 ]
    let w0 = src0[ srcOffset0 + 3 ]
    const x1 = src1[ srcOffset1 + 0 ]
    const y1 = src1[ srcOffset1 + 1 ]
    const z1 = src1[ srcOffset1 + 2 ]
    const w1 = src1[ srcOffset1 + 3 ]
    if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
      let s = 1 - t
      const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1
      const dir = cos >= 0 ? 1 : -1
      const sqrSin = 1 - cos * cos
      // Skip the Slerp for tiny steps to avoid numeric problems:
      if (sqrSin > Number.EPSILON) {
        const sin = Math.sqrt(sqrSin)
        const len = Math.atan2(sin, cos * dir)
        s = Math.sin(s * len) / sin
        t = Math.sin(t * len) / sin
      }
      const tDir = t * dir
      x0 = x0 * s + x1 * tDir
      y0 = y0 * s + y1 * tDir
      z0 = z0 * s + z1 * tDir
      w0 = w0 * s + w1 * tDir
      // Normalize in case we just did a lerp:
      if (s === 1 - t) {
        const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0)
        x0 *= f
        y0 *= f
        z0 *= f
        w0 *= f
      }
    }
    dst[ dstOffset ] = x0
    dst[ dstOffset + 1 ] = y0
    dst[ dstOffset + 2 ] = z0
    dst[ dstOffset + 3 ] = w0
  }
}

const BUFFER_VECTOR3_0 = new Vector3()
const EPSILON = 0.000001
