/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Matrix3.js
 */

import { Vector3 } from './Vector3'

const MATRIX3_IDENTITY_ARRAY = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
]

export class Matrix3 {
  constructor (elementArray = MATRIX3_IDENTITY_ARRAY) {
    this.elements = new Float32Array(elementArray)
  }

  set (n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    const te = this.elements
    te[ 0 ] = n11
    te[ 1 ] = n21
    te[ 2 ] = n31
    te[ 3 ] = n12
    te[ 4 ] = n22
    te[ 5 ] = n32
    te[ 6 ] = n13
    te[ 7 ] = n23
    te[ 8 ] = n33
    return this
  }

  identity () {
    this.elements.set(MATRIX3_IDENTITY_ARRAY)
    return this
  }

  clone () {
    return (new Matrix3()).fromArray(this.elements)
  }

  copy (m) {
    const me = m.elements
    this.set(me[ 0 ], me[ 3 ], me[ 6 ], me[ 1 ], me[ 4 ], me[ 7 ], me[ 2 ], me[ 5 ], me[ 8 ])
    return this
  }

  setFromMatrix4 (m) {
    const me = m.elements
    this.set(me[ 0 ], me[ 4 ], me[ 8 ], me[ 1 ], me[ 5 ], me[ 9 ], me[ 2 ], me[ 6 ], me[ 10 ])
    return this
  }

  applyToVector3Array (array, offset = 0, length) {
    if (length === undefined) length = array.length
    for (let i = 0, j = offset; i < length; (i += 3), (j += 3)) {
      BUFFER_VECTOR3_0.fromArray(array, j)
      BUFFER_VECTOR3_0.applyMatrix3(this)
      BUFFER_VECTOR3_0.toArray(array, j)
    }
    return array
  }

  applyToBuffer (buffer, offset = 0, length) {
    if (length === undefined) length = buffer.length / buffer.itemSize
    for (let i = 0, j = offset; i < length; i++, j++) {
      BUFFER_VECTOR3_1.x = buffer.getX(j)
      BUFFER_VECTOR3_1.y = buffer.getY(j)
      BUFFER_VECTOR3_1.z = buffer.getZ(j)
      BUFFER_VECTOR3_1.applyMatrix3(this)
      buffer.setXYZ(BUFFER_VECTOR3_1.x, BUFFER_VECTOR3_1.y, BUFFER_VECTOR3_1.z)
    }
    return buffer
  }

  multiplyScalar (s) {
    const te = this.elements
    te[ 0 ] *= s
    te[ 3 ] *= s
    te[ 6 ] *= s
    te[ 1 ] *= s
    te[ 4 ] *= s
    te[ 7 ] *= s
    te[ 2 ] *= s
    te[ 5 ] *= s
    te[ 8 ] *= s
    return this
  }

  determinant () {
    const te = this.elements
    const a = te[ 0 ]
    const b = te[ 1 ]
    const c = te[ 2 ]
    const d = te[ 3 ]
    const e = te[ 4 ]
    const f = te[ 5 ]
    const g = te[ 6 ]
    const h = te[ 7 ]
    const i = te[ 8 ]
    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g
  }

  getInverse (matrix, throwOnDegenerate) {
    const me = matrix.elements
    const te = this.elements
    const n11 = me[ 0 ]
    const n21 = me[ 1 ]
    const n31 = me[ 2 ]
    const n12 = me[ 3 ]
    const n22 = me[ 4 ]
    const n32 = me[ 5 ]
    const n13 = me[ 6 ]
    const n23 = me[ 7 ]
    const n33 = me[ 8 ]
    const t11 = n33 * n22 - n32 * n23
    const t12 = n32 * n13 - n33 * n12
    const t13 = n23 * n12 - n22 * n13
    const det = n11 * t11 + n21 * t12 + n31 * t13
    if (det === 0) {
      const msg = "Matrix3.getInverse(): can't invert matrix, determinant is 0"
      if (throwOnDegenerate || false) throw new Error(msg)
      else console.warn(msg)
      return this.identity()
    }
    te[ 0 ] = t11
    te[ 1 ] = n31 * n23 - n33 * n21
    te[ 2 ] = n32 * n21 - n31 * n22
    te[ 3 ] = t12
    te[ 4 ] = n33 * n11 - n31 * n13
    te[ 5 ] = n31 * n12 - n32 * n11
    te[ 6 ] = t13
    te[ 7 ] = n21 * n13 - n23 * n11
    te[ 8 ] = n22 * n11 - n21 * n12
    return this.multiplyScalar(1 / det)
  }

  transpose () {
    const m = this.elements
    let tmp
    tmp = m[ 1 ]
    m[ 1 ] = m[ 3 ]
    m[ 3 ] = tmp
    tmp = m[ 2 ]
    m[ 2 ] = m[ 6 ]
    m[ 6 ] = tmp
    tmp = m[ 5 ]
    m[ 5 ] = m[ 7 ]
    m[ 7 ] = tmp
    return this
  }

  getNormalMatrix (matrix4) {
    return this.setFromMatrix4(matrix4).getInverse(this).transpose()
  }

  transposeIntoArray (r) {
    const m = this.elements
    r[ 0 ] = m[ 0 ]
    r[ 1 ] = m[ 3 ]
    r[ 2 ] = m[ 6 ]
    r[ 3 ] = m[ 1 ]
    r[ 4 ] = m[ 4 ]
    r[ 5 ] = m[ 7 ]
    r[ 6 ] = m[ 2 ]
    r[ 7 ] = m[ 5 ]
    r[ 8 ] = m[ 8 ]
    return this
  }

  fromArray (array) {
    this.elements.set(array)
    return this
  }

  toArray (array, offset) {
    if (array === undefined) array = []
    if (offset === undefined) offset = 0
    const te = this.elements
    array[ offset ] = te[ 0 ]
    array[ offset + 1 ] = te[ 1 ]
    array[ offset + 2 ] = te[ 2 ]
    array[ offset + 3 ] = te[ 3 ]
    array[ offset + 4 ] = te[ 4 ]
    array[ offset + 5 ] = te[ 5 ]
    array[ offset + 6 ] = te[ 6 ]
    array[ offset + 7 ] = te[ 7 ]
    array[ offset + 8 ] = te[ 8 ]
    return array
  }
}

const BUFFER_VECTOR3_0 = new Vector3()
const BUFFER_VECTOR3_1 = new Vector3()
