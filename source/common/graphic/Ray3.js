/**
 * modified from three js: https://github.com/mrdoob/three.js/blob/master/src/math/Ray.js
 */
import { Vector3 } from './Vector3'

export class Ray3 {
  constructor (origin = new Vector3(), direction = new Vector3()) {
    this.origin = origin
    this.direction = direction
  }

  set (origin, direction) {
    this.origin.copy(origin)
    this.direction.copy(direction)
    return this
  }

  clone () {
    return new this.constructor().copy(this)
  }

  copy (ray) {
    this.origin.copy(ray.origin)
    this.direction.copy(ray.direction)
    return this
  }

  at (t, optionalTarget) {
    const result = optionalTarget || new Vector3()
    return result.copy(this.direction).multiplyScalar(t).add(this.origin)
  }

  lookAt (v) {
    this.direction.copy(v).sub(this.origin).normalize()
  }

  recast (t) {
    this.origin.copy(this.at(t, BUFFER_VECTOR3_0))
    return this
  }

  closestPointToPoint (point, optionalTarget) {
    const result = optionalTarget || new Vector3()
    result.subVectors(point, this.origin)
    const directionDistance = result.dot(this.direction)
    if (directionDistance < 0) {
      return result.copy(this.origin)
    }
    return result.copy(this.direction).multiplyScalar(directionDistance).add(this.origin)
  }

  distanceToPoint (point) {
    return Math.sqrt(this.distanceSquaredToPoint(point))
  }

  distanceSquaredToPoint (point) {
    const directionDistance = BUFFER_VECTOR3_1.subVectors(point, this.origin).dot(this.direction)
    // point behind the ray
    if (directionDistance < 0) {
      return this.origin.distanceToSquared(point)
    }
    BUFFER_VECTOR3_1.copy(this.direction).multiplyScalar(directionDistance).add(this.origin)
    return BUFFER_VECTOR3_1.distanceToSquared(point)
  }

  intersectSphere (sphere, optionalTarget) {
    BUFFER_VECTOR3_2.subVectors(sphere.center, this.origin)
    const tca = BUFFER_VECTOR3_2.dot(this.direction)
    const d2 = BUFFER_VECTOR3_2.dot(BUFFER_VECTOR3_2) - tca * tca
    const radius2 = sphere.radius * sphere.radius
    if (d2 > radius2) return null
    const thc = Math.sqrt(radius2 - d2)
    // t0 = first intersect point - entrance on front of sphere
    const t0 = tca - thc
    // t1 = second intersect point - exit point on back of sphere
    const t1 = tca + thc
    // test to see if both t0 and t1 are behind the ray - if so, return null
    if (t0 < 0 && t1 < 0) return null
    // test to see if t0 is behind the ray:
    // if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
    // in order to always return an intersect point that is in front of the ray.
    if (t0 < 0) return this.at(t1, optionalTarget)
    // else t0 is in front of the ray, so return the first collision point scaled by t0
    return this.at(t0, optionalTarget)
  }

  intersectsSphere (sphere) {
    return this.distanceToPoint(sphere.center) <= sphere.radius
  }

  distanceToPlane (plane) {
    const denominator = plane.normal.dot(this.direction)
    if (denominator === 0) {
      // line is coplanar, return origin
      if (plane.distanceToPoint(this.origin) === 0) {
        return 0
      }
      // Null is preferable to undefined since undefined means.... it is undefined
      return null
    }
    const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator
    // Return if the ray never intersects the plane
    return t >= 0 ? t : null
  }

  intersectPlane (plane, optionalTarget) {
    const t = this.distanceToPlane(plane)
    if (t === null) {
      return null
    }
    return this.at(t, optionalTarget)
  }

  intersectsPlane (plane) {
    // check if the ray lies on the plane first
    const distToPoint = plane.distanceToPoint(this.origin)
    if (distToPoint === 0) {
      return true
    }
    const denominator = plane.normal.dot(this.direction)
    if (denominator * distToPoint < 0) {
      return true
    }
    // ray origin is behind the plane (and is pointing behind it)
    return false
  }

  intersectBox (box, optionalTarget) {
    let tmin, tmax, tymin, tymax, tzmin, tzmax
    const invdirx = 1 / this.direction.x
    const invdiry = 1 / this.direction.y
    const invdirz = 1 / this.direction.z
    const origin = this.origin
    if (invdirx >= 0) {
      tmin = (box.min.x - origin.x) * invdirx
      tmax = (box.max.x - origin.x) * invdirx
    } else {
      tmin = (box.max.x - origin.x) * invdirx
      tmax = (box.min.x - origin.x) * invdirx
    }
    if (invdiry >= 0) {
      tymin = (box.min.y - origin.y) * invdiry
      tymax = (box.max.y - origin.y) * invdiry
    } else {
      tymin = (box.max.y - origin.y) * invdiry
      tymax = (box.min.y - origin.y) * invdiry
    }
    if (tmin > tymax || tymin > tmax) return null
    // These lines also handle the case where tmin or tmax is NaN
    // (result of 0 * Infinity). x !== x returns true if x is NaN
    if (tymin > tmin || isNaN(tmin)) tmin = tymin
    if (tymax < tmax || isNaN(tmax)) tmax = tymax
    if (invdirz >= 0) {
      tzmin = (box.min.z - origin.z) * invdirz
      tzmax = (box.max.z - origin.z) * invdirz
    } else {
      tzmin = (box.max.z - origin.z) * invdirz
      tzmax = (box.min.z - origin.z) * invdirz
    }
    if (tmin > tzmax || tzmin > tmax) return null
    if (tzmin > tmin || isNaN(tmin)) tmin = tzmin
    if (tzmax < tmax || isNaN(tmax)) tmax = tzmax
    // return point closest to the ray (positive side)
    if (tmax < 0) return null
    return this.at(tmin >= 0 ? tmin : tmax, optionalTarget)
  }

  intersectsBox (box) {
    return this.intersectBox(box, BUFFER_VECTOR3_3) !== null
  }

  applyMatrix4 (matrix4) {
    this.direction.add(this.origin).applyMatrix4(matrix4)
    this.origin.applyMatrix4(matrix4)
    this.direction.sub(this.origin)
    this.direction.normalize()
    return this
  }

  equals (ray) {
    return ray.origin.equals(this.origin) && ray.direction.equals(this.direction)
  }
}

const BUFFER_VECTOR3_0 = new Vector3()
const BUFFER_VECTOR3_1 = new Vector3()
const BUFFER_VECTOR3_2 = new Vector3()
const BUFFER_VECTOR3_3 = new Vector3()
