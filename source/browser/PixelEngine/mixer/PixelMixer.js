/*
 Mix(Interpolation) Logic
 */
class PixelMixer {
  constructor (buffer) {
    this.dataFrom = null // hold data, read-only
    this.dataTo = null // hold data, read-only
    this.buffer = buffer // hold result, write-only
    this.progress = 0 // not [0, 1], can be very large
    this.mixProgressTotal = 0 // not [0, 1], can be very large
  }

  clear () {
    this.dataFrom = null // mix
    this.dataTo = null // mix
    this.buffer.clear() // mix
    this.progress = 0
    this.mixProgressTotal = 0
  }

  setMixBuffer (dataFrom, dataTo, mixProgressTotal) {
    this.dataFrom = dataFrom
    this.dataTo = dataTo || dataFrom
    this.buffer.setMixData(this.dataFrom, this.dataTo)
    this.progress = 0
    this.mixProgressTotal = mixProgressTotal
  }

  next (deltaProgress) {
    this.progress += deltaProgress
    if (this.progress >= this.mixProgressTotal) {
      this.clear()
      return null
    } else {
      const progress = this.progress / this.mixProgressTotal
      return this.mix(progress)
    }
  }

  mix (progress) {
    if (progress <= 0) return this.dataFrom
    if (progress >= 1) return this.dataTo
    this.buffer.mix(progress)
    return this.buffer.getMixedData()
  }
}

// getMixed___ use 3 arguments: from, to, progress
// mix___ use 4 arguments: result, from, to, progress
// note result must be an object or the argument is passed by value
function mixNumber (from, to, progress) {
  return from + (to - from) * progress
}
function mixVector3 (result, from, to, progress) {
  result.x = mixNumber(from.x, to.x, progress)
  result.y = mixNumber(from.y, to.y, progress)
  result.z = mixNumber(from.z, to.z, progress)
}
function mixQuaternion (result, from, to, progress) {
  result.copy(from).slerp(to, progress)
}

class PixelMixerSampleBuffer {
  constructor () {
    this.dataFrom = null
    this.dataTo = null
  }

  clear () {
    this.dataFrom = null
    this.dataTo = null
  }

  setMixData (dataFrom, dataTo) {
    this.dataFrom = dataFrom
    this.dataTo = dataTo
  }

  getMixedData () {
    return this.dataFrom
  }

  mix (progress) {
    // should implement mix logic here
  }
}

export {
  PixelMixer,
  PixelMixerSampleBuffer,
  mixVector3,
  mixQuaternion
}
