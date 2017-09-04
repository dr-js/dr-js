/**
 This implements pixel model hierarchy(tree) in PixCor,
 a basic 'PixelObject'

 This is packs graphical data & method for physics, animation, and game logic

 This will not be used directly in game,
 need to pack at least once more (for actor/world/ui)
 */

import { Vector3, Box3, Quaternion, Matrix4 } from 'source/common/graphic'
import { TreeNode } from 'source/common/data'
import { PixelModelPart } from './PixelModelPart'

class PixelModel extends TreeNode {
  constructor (id) {
    super(id)

    this.position = new Vector3()
    this.rotation = new Quaternion()

    this.isVisible = true

    this.partMap = {} // name - PixelModelPart

    this.shouldUpdateLocal = true
    this.transformMatrix = new Matrix4() // local

    this.shouldUpdateWorld = true
    this.transformMatrixWorld = new Matrix4() // buffered world * local

    this.shouldUpdateAABB = true
    this.aabb = new Box3()
  }

  updateTransformMatrix () {
    if (this.shouldUpdateLocal !== true) return
    this.transformMatrix.makeRotationFromQuaternion(this.rotation)
    this.transformMatrix.setPosition(this.position)
    this.shouldUpdateLocal = false
    this.shouldUpdateWorld = true
    this.shouldUpdateAABB = true
  }

  updateAABB () {
    if (this.shouldUpdateAABB !== true) return
    this.aabb.makeEmpty()
    const partMap = this.partMap
    for (const name in partMap) {
      this.aabb.union(partMap[ name ].aabb)
    }
    // TODO: consider not add for reuse?
    this.aabb.min.add(this.position)
    this.aabb.max.add(this.position)
    this.shouldUpdateAABB = false
  }

  updateTransformMatrixWorld (isForced) {
    this.updateTransformMatrix()

    if (this.shouldUpdateWorld === true || isForced === true) {
      if (this.parent === null) this.transformMatrixWorld.copy(this.transformMatrix)
      else this.transformMatrixWorld.multiplyMatrices(this.parent.transformMatrixWorld, this.transformMatrix)
      this.shouldUpdateWorld = false
      isForced = true
    }

    // update children
    for (const id in this.children) {
      this.children[ id ].updateTransformMatrixWorld(isForced)
    }
  }

  applyData (modelData) {
    // data apply logic
    this.position.fromArray(modelData.xyz)
    this.rotation.fromArray(modelData.xyzw)

    const partMap = this.partMap
    const dataPartList = modelData.parts
    for (let index = 0, indexMax = dataPartList.length; index < indexMax; index++) {
      const part = PixelModelPart.loadData(dataPartList[ index ])
      partMap[ part.name ] = part
    }
    this.updateAABB()
  }

  static loadData (modelData, targetModel = new PixelModel()) {
    targetModel.applyData(modelData)
    return targetModel
  }
}

// const samplePixelModelData = {
//   xyz: [ 0, 0, 0 ],
//   xyzw: [ 0, 0, 0, 0 ],
//   parts: [ '{PixelModelPart}' ]
// }

export {
  PixelModel
}
