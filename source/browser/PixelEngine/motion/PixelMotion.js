import { PixelMixer, PixelFrameMixerBuffer } from '../mixer'
import { PixelFrame } from './PixelFrame'

/**
 * Compare to Model:
 *    node: PixelModel <-->  PixelMotion - wrap - PixelFrame - contain - PixelBone
 *    part: PixelPart  <-->  PixelBone - wrap - PixelPart - contain - PixelPixel
 *
 * Combine PixelBone - PixelPart and PixelFrame data,
 * receive deltaTime and generate corresponding PixelModel(Different Morph for PixelParts)
 *
 * TODO: For game purpose, will add some physics related logic to Frame Generation
 *
 */

class PixelMotion {
  constructor () {
    this.frameFps = 30
    this.frameDuration = 1.0 / this.frameFps

    this.keyFrameList = [] // all keyFrameList here
    this.frameCount = 0

    this.mixer = new PixelMixer(new PixelFrameMixerBuffer())

    this.model = null // attached model

    this.isActive = false
    this.isLoop = false

    this.currentFrameId = 0
    this.currentFrameDuration = 0
    this.currentFrame = null
  }

  reset () {
    this.currentFrameId = 0
    this.currentFrameDuration = 0
    this.currentFrame = null
  }

  start (isLoop = false, frameId = 0) {
    this.isActive = true
    this.isLoop = isLoop

    this.reset()
    this.currentFrameId = frameId

    // wait for update
  }

  stop () {
    this.isActive = false
  }

  update (deltaTime) {
    if (this.isActive) {
      this.currentFrameDuration += deltaTime

      while (this.currentFrameDuration > this.frameDuration) {
        this.currentFrameDuration -= this.frameDuration
        this.currentFrameId++

        if (this.currentFrameId < this.frameCount) {
          this.nextFrame()
        } else if (this.isLoop) {
          this.reset()
        } else {
          this.stop()
          break
        }
      }
    }
  }

  nextFrame () {
    this.currentFrame = this.mixer.next(1) // generate next frame, null if current mix ended

    if (this.currentFrame === null) {
      this.currentFrame = this.getKeyFrame(this.currentFrameId)
      this.mixer.setMixBuffer(this.currentFrame, this.currentFrame.nextFrame, this.currentFrame.frameCount)
    }
  }

  getKeyFrame (frameId) {
    const frameList = this.keyFrameList
    let keyFrameIndex = 0
    for (let index = 0, indexMax = frameList.length; index < indexMax; index++) {
      if (frameList[ index ].frameId <= frameId) keyFrameIndex = index
      else break
    }
    return frameList[ keyFrameIndex ]
  }

  generateFrameInfo () {
    this.frameCount = 0

    const frameList = this.keyFrameList
    for (let index = 0, indexMax = frameList.length; index < indexMax; index++) {
      const keyFrame = frameList[ index ]
      const nextKeyFrame = frameList[ index + 1 ] || null

      keyFrame.frameCount = nextKeyFrame ? nextKeyFrame.frameId - keyFrame.frameId : 1
      keyFrame.nextFrame = nextKeyFrame

      if (keyFrame.frameCount <= 0) throw new Error('invalid frameCount:', keyFrame.frameCount, keyFrame.frameId, nextKeyFrame ? nextKeyFrame.frameId : -1)

      this.frameCount += keyFrame.frameCount
    }
  }

  attachModel (model) {
    this.model = model

    const frameList = this.keyFrameList
    for (let index = 0, indexMax = frameList.length; index < indexMax; index++) {
      frameList[ index ].attachModel(model)
    }
  }

  detachModel () {
    this.model = null

    const frameList = this.keyFrameList
    for (let index = 0, indexMax = frameList.length; index < indexMax; index++) {
      frameList[ index ].detachModel()
    }
  }

  applyData (pixelMotionData) {
    // data apply logic
    this.frameFps = pixelMotionData.fps
    this.frameDuration = 1.0 / this.frameFps

    const frameList = this.keyFrameList
    const dataFrameList = pixelMotionData.frames
    for (let index = 0, indexMax = dataFrameList.length; index < indexMax; index++) {
      frameList.push(PixelFrame.loadData(dataFrameList[ index ]))
    }
  }

  static loadData (pixelMotionData, loadedPixelMotion) {
    if (loadedPixelMotion === undefined) loadedPixelMotion = new PixelMotion()
    loadedPixelMotion.applyData(pixelMotionData)
    return loadedPixelMotion
  }
}

// const samplePixelMotionData = {
//   fps: 30, // only for frame switching speed, not play FPS
//   frames: [ '{PixelFrame}' ]
// }

export {
  PixelMotion
}
