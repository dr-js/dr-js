import { PixelFrame } from '../motion'
import { PixelBoneMixerBuffer } from './PixelBoneMixerBuffer'
import { mixVector3, mixQuaternion } from './PixelMixer'

class PixelFrameMixerBuffer {
  constructor () {
    this.dataFrom = null
    this.dataTo = null
    this.bufferFrame = new PixelFrame()
    this.bufferBoneList = [] // all bones for this model
  }

  clear () {
    this.dataFrom = null
    this.dataTo = null
    this.bufferFrame.clear()
    this.bufferBoneList.length = 0
  }

  setMixData (dataFrom, dataTo) {
    this.dataFrom = dataFrom
    this.dataTo = dataTo
    // copy value
    // TODO: remove excess bones from previous frame
    this.bufferFrame.frameCount = dataFrom.frameCount
    this.bufferFrame.nextFrame = dataFrom.nextFrame
    this.bufferFrame.model = dataFrom.model
    this.bufferFrame.modelPosition = dataFrom.modelPosition
    this.bufferFrame.modelRotation = dataFrom.modelRotation

    this.bufferBoneList.length = 0
    for (const name in dataFrom.bones) {
      const bufferBone = new PixelBoneMixerBuffer()
      bufferBone.setMixData(dataFrom.bones[ name ], dataTo.bones[ name ]) // some bones may hide for some frames(dataTo === undefined)
      this.bufferBoneList.push(bufferBone)
    }
    // reset part visible
    const partMap = dataFrom.model.partMap
    for (const name in partMap) {
      partMap[ name ].isVisible = (dataFrom.bones[ name ] !== undefined)
    }
  }

  getMixedData () {
    return this.bufferFrame
  }

  mix (progress) {
    mixVector3(this.bufferFrame.modelPosition, this.dataFrom.position, this.dataTo.position, progress)
    mixQuaternion(this.bufferFrame.modelRotation, this.dataFrom.rotation, this.dataTo.rotation, progress)
    // bones
    for (let index = 0, indexMax = this.bufferBoneList.length; index < indexMax; index++) {
      this.bufferBoneList[ index ].mix(progress)
    }
    this.bufferFrame.onChange()
  }
}

export {
  PixelFrameMixerBuffer
}
