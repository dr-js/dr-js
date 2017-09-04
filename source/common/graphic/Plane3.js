/**
 * A 3D Plane:
 * 0 = a * X + b * Y + c * Z + d
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Plane3.js
 */

import { Vector3 } from './Vector3'
import { Matrix3 } from './Matrix3'

export class Plane3 {
  constructor (normal = new Vector3(1, 0, 0), constant = 0) {
    this.normal = normal
    this.constant = constant
  }

  set (normal, constant) {
    this.normal.copy(normal)
    this.constant = constant
    return this
  }

  setComponents (x, y, z, w) {
    this.normal.set(x, y, z)
    this.constant = w
    return this
  }

  setFromNormalAndCoplanarPoint (normal, point) {
    this.normal.copy(normal)
    this.constant = -point.dot(this.normal) // must be this.normal, not normal, as this.normal is normalized
    return this
  }

  setFromCoplanarPoints (a, b, c) {
    const normal = BUFFER_VECTOR3_0.subVectors(c, b).cross(BUFFER_VECTOR3_1.subVectors(a, b)).normalize()
    // Q: should an error be thrown if normal is zero (e.g. degenerate plane)?
    this.setFromNormalAndCoplanarPoint(normal, a)
    return this
  }

  clone () {
    return new this.constructor().copy(this)
  }

  copy (plane) {
    this.normal.copy(plane.normal)
    this.constant = plane.constant
    return this
  }

  normalize () {
    // Note: will lead to a divide by zero if the plane is invalid.
    const inverseNormalLength = 1.0 / this.normal.length()
    this.normal.multiplyScalar(inverseNormalLength)
    this.constant *= inverseNormalLength
    return this
  }

  negate () {
    this.constant *= -1
    this.normal.negate()
    return this
  }

  distanceToPoint (point) {
    return this.normal.dot(point) + this.constant
  }

  distanceToSphere (sphere) {
    return this.distanceToPoint(sphere.center) - sphere.radius
  }

  projectPoint (point, optionalTarget) {
    return this.orthoPoint(point, optionalTarget).sub(point).negate()
  }

  orthoPoint (point, optionalTarget) {
    const perpendicularMagnitude = this.distanceToPoint(point)
    const result = optionalTarget || new Vector3()
    return result.copy(this.normal).multiplyScalar(perpendicularMagnitude)
  }

  intersectLine (line, optionalTarget = new Vector3()) {
    const result = optionalTarget
    const direction = line.delta(BUFFER_VECTOR3_2)
    const denominator = this.normal.dot(direction)
    if (denominator === 0) {
      // line is coplanar, return origin
      if (this.distanceToPoint(line.start) === 0) return result.copy(line.start)
      // Unsure if this is the correct method to handle this case.
      return undefined
    }
    const t = -(line.start.dot(this.normal) + this.constant) / denominator
    if (t < 0 || t > 1) return undefined
    return result.copy(direction).multiplyScalar(t).add(line.start)
  }

  intersectsLine (line) {
    // Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.
    const startSign = this.distanceToPoint(line.start)
    const endSign = this.distanceToPoint(line.end)
    return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0)
  }

  intersectsBox (box) {
    return box.intersectsPlane(this)
  }

  intersectsSphere (sphere) {
    return sphere.intersectsPlane(this)
  }

  coplanarPoint (optionalTarget) {
    const result = optionalTarget || new Vector3()
    return result.copy(this.normal).multiplyScalar(-this.constant)
  }

  applyMatrix4 (matrix, optionalNormalMatrix) {
    // compute new normal based on theory here:
    // http://www.songho.ca/opengl/gl_normaltransform.html
    const normalMatrix = optionalNormalMatrix || BUFFER_MATRIX3_0.getNormalMatrix(matrix)
    const newNormal = BUFFER_VECTOR3_3.copy(this.normal).applyMatrix3(normalMatrix)
    const newCoplanarPoint = this.coplanarPoint(BUFFER_VECTOR3_4)
    newCoplanarPoint.applyMatrix4(matrix)
    this.setFromNormalAndCoplanarPoint(newNormal, newCoplanarPoint)
    return this
  }

  translate (offset) {
    this.constant = this.constant - offset.dot(this.normal)
    return this
  }

  equals (plane) {
    return plane.normal.equals(this.normal) && plane.constant === this.constant
  }
}

const BUFFER_VECTOR3_0 = new Vector3()
const BUFFER_VECTOR3_1 = new Vector3()
const BUFFER_VECTOR3_2 = new Vector3()
const BUFFER_VECTOR3_3 = new Vector3()
const BUFFER_VECTOR3_4 = new Vector3()
const BUFFER_MATRIX3_0 = new Matrix3()
