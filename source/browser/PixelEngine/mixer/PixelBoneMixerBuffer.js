import { PixelBone } from '../motion'
import { mixVector3, mixQuaternion } from './PixelMixer'

class PixelBoneMixerBuffer {
  constructor () {
    this.dataFrom = null
    this.dataTo = null
    this.bufferBone = new PixelBone()
  }

  clear () {
    this.dataFrom = null
    this.dataTo = null
    this.bufferBone.clear()
  }

  setMixData (dataFrom, dataTo) {
    this.dataFrom = dataFrom
    this.dataTo = dataTo
    // reset buffer
    this.bufferBone.part = dataFrom.part
    this.bufferBone.partName = dataFrom.partName
    this.bufferBone.partPosition = dataFrom.partPosition
    this.bufferBone.partRotation = dataFrom.partRotation
  }

  getMixedData () {
    return this.bufferBone
  }

  mix (progress) {
    if (!this.dataTo) return
    mixVector3(this.bufferBone.partPosition, this.dataFrom.position, this.dataTo.position, progress)
    mixQuaternion(this.bufferBone.partRotation, this.dataFrom.rotation, this.dataTo.rotation, progress)
    this.bufferBone.onChange()
  }
}

export {
  PixelBoneMixerBuffer
}
