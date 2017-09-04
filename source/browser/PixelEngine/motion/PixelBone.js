import { Vector3, Quaternion } from 'source/common/graphic'

// TODO: consider add scale?
class PixelBone {
  constructor () {
    this.position = new Vector3()
    this.rotation = new Quaternion()
    this.part = null // attaching PixelModelPart
    this.partName = null // attaching PixelModelPart name
    this.partPosition = null
    this.partRotation = null
  }

  clear () {
    this.part = null // attaching PixelModelPart
    this.partName = null // attaching PixelModelPart name
    this.partPosition = null
    this.partRotation = null
  }

  onChange () {
    this.part.updateTransformMatrix()
    // this.part.updateAABB(); // TODO: currently impossible
  }

  attachModel (model) {
    this.part = model.partMap[ this.partName ]
    this.partPosition = this.part.position
    this.partRotation = this.part.rotation
  }

  detachModel () {
    this.part = null
    this.partPosition = null
    this.partRotation = null
  }

  applyData (boneData) {
    // data apply logic
    this.partName = boneData.name
    this.position.fromArray(boneData.xyz)
    this.rotation.fromArray(boneData.xyzw)
  }

  static loadData (boneData, targetBone = new PixelBone()) {
    targetBone.applyData(boneData)
    return targetBone
  }
}

// const samplePixelBoneData = {
//   name: 'A', // string, attaching PixelModelPart name
//   xyz: [ 0, 0, 0 ],
//   xyzw: [ 0, 0, 0, 0 ]
// }

export {
  PixelBone
}
