/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Box3.js
 * actually this is a 3D AABB
 */
import { Vector3 } from './Vector3'

export class Box3 {
  constructor (min = new Vector3(+Infinity, +Infinity, +Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min
    this.max = max
  }

  set (min, max) {
    this.min.copy(min)
    this.max.copy(max)
    return this
  }

  setFromCenterAndSize (center, size) {
    const { x, y, z } = center
    const hsx = size.x * 0.5
    const hsy = size.y * 0.5
    const hsz = size.z * 0.5
    this.min.set(x - hsx, y - hsy, z - hsz)
    this.max.set(x + hsx, y + hsy, z + hsz)
    return this
  }

  setFromCenterAndRadius (center, radius) {
    const { x, y, z } = center
    this.min.set(x - radius, y - radius, z - radius)
    this.max.set(x + radius, y + radius, z + radius)
    return this
  }

  clone () {
    return (new Box3()).copy(this)
  }

  copy (box) {
    this.min.copy(box.min)
    this.max.copy(box.max)
    return this
  }

  makeEmpty () {
    this.min.x = this.min.y = this.min.z = +Infinity
    this.max.x = this.max.y = this.max.z = -Infinity
    return this
  }

  isEmpty () {
    // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z
  }

  center (optionalTarget) {
    const result = optionalTarget || new Vector3()
    return result.addVectors(this.min, this.max).multiplyScalar(0.5)
  }

  size (optionalTarget) {
    const result = optionalTarget || new Vector3()
    return result.subVectors(this.max, this.min)
  }

  perimeter () {
    const x = this.max.x - this.min.x
    const y = this.max.y - this.min.y
    const z = this.max.z - this.min.z
    return 2 * (x + y + z)
  }

  volume () {
    const x = this.max.x - this.min.x
    const y = this.max.y - this.min.y
    const z = this.max.z - this.min.z
    return x * y * z
  }

  intersect (box) {
    this.min.max(box.min)
    this.max.min(box.max)
    return this
  }

  union (box) {
    this.min.min(box.min)
    this.max.max(box.max)
    return this
  }

  unionBoxes (boxA, boxB) {
    const minA = boxA.min
    const maxA = boxA.max
    const minB = boxB.min
    const maxB = boxB.max
    this.min.x = Math.min(minA.x, minB.x)
    this.min.y = Math.min(minA.y, minB.y)
    this.min.z = Math.min(minA.z, minB.z)
    this.max.x = Math.max(maxA.x, maxB.x)
    this.max.y = Math.max(maxA.y, maxB.y)
    this.max.z = Math.max(maxA.z, maxB.z)
    return this
  }

  translate (offset) {
    this.min.add(offset)
    this.max.add(offset)
    return this
  }

  equals (box) {
    return box.min.equals(this.min) && box.max.equals(this.max)
  }

  clampPoint (point, optionalTarget) {
    const result = optionalTarget || new Vector3()
    return result.copy(point).clamp(this.min, this.max)
  }

  distanceToPoint (point) {
    const clampedPoint = BUFFER_VECTOR3_0.copy(point).clamp(this.min, this.max)
    return clampedPoint.sub(point).length()
  }

  expandByPoint (point) {
    this.min.min(point)
    this.max.max(point)
    return this
  }

  containsPoint (point) {
    return !(point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y || point.z < this.min.z || point.z > this.max.z)
  }

  containsBox (box) {
    return !(this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y && this.min.z <= box.min.z && box.max.z <= this.max.z)
  }

  intersectsBox (box) {
    // using 6 splitting planes to rule out intersections.
    return !(box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y || box.max.z < this.min.z || box.min.z > this.max.z)
  }

  intersectsSphere (sphere) {
    const closestPoint = BUFFER_VECTOR3_1
    // Find the point on the AABB closest to the sphere center.
    this.clampPoint(sphere.center, closestPoint)
    // If that point is inside the sphere, the AABB and sphere intersect.
    return closestPoint.distanceToSquared(sphere.center) <= sphere.radius * sphere.radius
  }

  intersectsPlane (plane) {
    // We compute the minimum and maximum dot product values. If those values
    // are on the same side (back or front) of the plane, then there is no intersection.
    let min, max
    if (plane.normal.x > 0) {
      min = plane.normal.x * this.min.x
      max = plane.normal.x * this.max.x
    } else {
      min = plane.normal.x * this.max.x
      max = plane.normal.x * this.min.x
    }
    if (plane.normal.y > 0) {
      min += plane.normal.y * this.min.y
      max += plane.normal.y * this.max.y
    } else {
      min += plane.normal.y * this.max.y
      max += plane.normal.y * this.min.y
    }
    if (plane.normal.z > 0) {
      min += plane.normal.z * this.min.z
      max += plane.normal.z * this.max.z
    } else {
      min += plane.normal.z * this.max.z
      max += plane.normal.z * this.min.z
    }
    return min <= plane.constant && max >= plane.constant
  }
}

const BUFFER_VECTOR3_0 = new Vector3()
const BUFFER_VECTOR3_1 = new Vector3()
