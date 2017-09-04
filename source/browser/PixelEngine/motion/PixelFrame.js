import { Vector3, Quaternion } from 'source/common/graphic'
import { PixelBone } from './PixelBone'

/*
 A state (key frame) for all PixelBone in a PixelMotion,
 frames between PixelFrame are auto generated (slop + time)
 */
class PixelFrame {
  constructor () {
    this.frameId = 0 // id for play
    this.frameCount = 0
    this.nextFrame = null

    this.position = new Vector3()
    this.rotation = new Quaternion()
    this.bones = {} // attaching PixelBone

    this.model = null
    this.modelPosition = null
    this.modelRotation = null
  }

  clear () {
    this.frameId = 0 // id for play
    this.frameCount = 0
    this.nextFrame = null
    this.bones = {} // attaching PixelBone

    this.model = null
    this.modelPosition = null
    this.modelRotation = null
  }

  onChange () {
    this.model.shouldUpdateLocal = true
  }

  attachModel (model) {
    this.model = model
    this.modelPosition = model.position
    this.modelRotation = model.rotation

    for (const name in this.bones) {
      this.bones[ name ].attachModel(model)
    }
  }

  detachModel () {
    this.model = null
    this.modelPosition = null
    this.modelRotation = null

    for (const name in this.bones) {
      this.bones[ name ].detachModel()
    }
  }

  applyData (frameData) {
    // data apply logic
    this.frameId = frameData.id
    this.position.fromArray(frameData.xyz)
    this.rotation.fromArray(frameData.xyzw)

    const boneList = this.bones
    const dataBoneList = frameData.bones
    for (let index = 0, indexMax = dataBoneList.length; index < indexMax; index++) {
      const pixelBone = PixelBone.loadData(dataBoneList[ index ])
      boneList[ pixelBone.partName ] = pixelBone
    }
  }

  static loadData (frameData, loadedPixelFrame) {
    if (loadedPixelFrame === undefined) loadedPixelFrame = new PixelFrame()
    loadedPixelFrame.applyData(frameData)
    return loadedPixelFrame
  }
}

// const samplePixelFrameData = {
//   id: 0, // number, starts from 0
//   xyz: [ 0, 0, 0 ],
//   xyzw: [ 0, 0, 0, 0 ],
//   bones: [ '{PixelBone}' ]
// }

export {
  PixelFrame
}
