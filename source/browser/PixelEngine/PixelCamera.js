import { Vector3, Quaternion, Matrix4 } from 'source/common/graphic'

const BUFFER_MATRIX = new Matrix4()
const BUFFER_QUATERNION = new Quaternion()
const BUFFER_VECTOR_0 = new Vector3()
const BUFFER_VECTOR_1 = new Vector3()
const FRONT_VECTOR = new Vector3(0, 0, -1)

class PixelCamera {
  constructor () {
    this.positionSelf = new Vector3(0, 0, 100)
    this.positionFocus = new Vector3(0, 0, 0) // not necessary for a static camera, but useful for camera moving
    this.directionUp = new Vector3(0, 1, 0)

    this.zoom = 1.0

    // (For Right-handed system) From the minimum corner at (left, bottom, far) and the maximum corner at (right, top, near). size: (right - left, top - bottom, near - far)
    // To a minimum corner at (-1,-1,-1) and a maximum corner at (1,1,1). size: (2 x 2 x 2)
    this.projectionMatrix = new Matrix4()
    this.projectionMatrix.makeOrthographic(-0.5, 0.5, -0.5, 0.5, 0.5, -0.5)

    this.viewMatrix = new Matrix4()
    this.viewProjectionMatrix = new Matrix4()
    this.focusViewProjectionMatrix = new Matrix4()
  }

  copy (camera) {
    this.positionSelf.copy(camera.positionSelf)
    this.positionFocus.copy(camera.positionFocus)
    this.directionUp.copy(camera.directionUp)
    this.zoom = camera.zoom
    this.projectionMatrix.copy(camera.projectionMatrix)
    this.viewMatrix.copy(camera.viewMatrix)
    this.viewProjectionMatrix.copy(camera.viewProjectionMatrix)
    this.focusViewProjectionMatrix.copy(camera.focusViewProjectionMatrix)
    return this
  }

  getViewProjectionMatrix () {
    return this.viewProjectionMatrix
  }

  getFocusViewProjectionMatrix () {
    return this.focusViewProjectionMatrix
  }

  updateViewProjectionMatrix () {
    // rotation
    BUFFER_MATRIX.identity() // lookAt won't clear transition data
    BUFFER_MATRIX.lookAt(this.positionSelf, this.positionFocus, this.directionUp)
    this.viewMatrix.getInverse(BUFFER_MATRIX) // inverse for the world -> camera transform

    // focus matrix translation (shift origin)
    BUFFER_MATRIX.makeTranslation(-this.positionFocus.x, -this.positionFocus.y, -this.positionFocus.z)

    // move then rotate
    BUFFER_MATRIX.multiplyMatrices(this.viewMatrix, BUFFER_MATRIX)

    this.focusViewProjectionMatrix.multiplyMatrices(this.projectionMatrix, BUFFER_MATRIX)

    // translation (shift origin)
    BUFFER_MATRIX.makeTranslation(-this.positionSelf.x, -this.positionSelf.y, -this.positionSelf.z)

    // move then rotate
    this.viewMatrix.multiplyMatrices(this.viewMatrix, BUFFER_MATRIX)

    // calculate View, Projection Matrix
    // process: Projection(3D->2D) * View(Camera) * World Matrix * Model Matrix * Model Vector --> Screen Vector
    this.viewProjectionMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix)
  }

  // Rotate Camera(Self) around Target
  rotateAroundTarget (quaternion) {
    BUFFER_VECTOR_0.subVectors(this.positionSelf, this.positionFocus)
    BUFFER_VECTOR_0.applyQuaternion(quaternion)
    this.positionSelf.addVectors(BUFFER_VECTOR_0, this.positionFocus)
  }

  // Rotate Target around Camera(Self)
  rotateAroundSelf (quaternion) {
    BUFFER_VECTOR_0.subVectors(this.positionFocus, this.positionSelf)
    BUFFER_VECTOR_0.applyQuaternion(quaternion)
    this.positionFocus.addVectors(BUFFER_VECTOR_0, this.positionSelf)
  }

  // relative to screen(fixed point)
  rotateAroundTargetSphere (rotateX, rotateY, speed) {
    if (speed === undefined) speed = 1
    BUFFER_VECTOR_0.set(rotateX, rotateY, 0)
    const rotateDistance = BUFFER_VECTOR_0.length() * speed
    if (rotateDistance === 0) return
    BUFFER_VECTOR_0.crossVectors(BUFFER_VECTOR_0, FRONT_VECTOR).normalize() // axis
    BUFFER_QUATERNION.setFromAxisAngle(BUFFER_VECTOR_0, rotateDistance)

    this.rotateAroundTarget(BUFFER_QUATERNION)
    this.directionUp.applyQuaternion(BUFFER_QUATERNION)
  }

  rotateAroundSelfSphere (rotateX, rotateY, speed) {
    if (speed === undefined) speed = 1
    BUFFER_VECTOR_0.set(rotateX, rotateY, 0)
    const rotateDistance = BUFFER_VECTOR_0.length() * speed
    if (rotateDistance === 0) return
    BUFFER_VECTOR_0.crossVectors(BUFFER_VECTOR_0, FRONT_VECTOR).normalize() // axis
    BUFFER_QUATERNION.setFromAxisAngle(BUFFER_VECTOR_0, rotateDistance)

    this.rotateAroundSelf(BUFFER_QUATERNION)
    this.directionUp.applyQuaternion(BUFFER_QUATERNION)
  }

  // relative to focus
  pan (panX, panY, panZ, speed, isSelfOnly) {
    if (speed === undefined) speed = 1
    if ((panX === 0 && panY === 0 && panZ === 0) || speed === 0) return

    BUFFER_VECTOR_0.subVectors(this.positionFocus, this.positionSelf) // --> camera z-
    BUFFER_VECTOR_1.crossVectors(BUFFER_VECTOR_0, this.directionUp).normalize() // --> camera x+

    BUFFER_VECTOR_1.setLength(panX * speed)
    BUFFER_VECTOR_0.setLength(-panZ * speed) // z
    BUFFER_VECTOR_0.add(BUFFER_VECTOR_1) // x, z
    BUFFER_VECTOR_1.copy(this.directionUp).setLength(panY * speed) // this.directionUp --> camera y+
    BUFFER_VECTOR_0.add(BUFFER_VECTOR_1) // z, y, z

    this.positionSelf.sub(BUFFER_VECTOR_0) // relative to focus
    if (isSelfOnly !== true) this.positionFocus.sub(BUFFER_VECTOR_0)
  }
}

export {
  PixelCamera
}
