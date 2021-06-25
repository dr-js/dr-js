import { CLOCK_PER_SECOND, clock, createTimer, requestFrameUpdate, cancelFrameUpdate } from 'source/common/time.js'
import { clamp } from 'source/common/math/base.js'
import { fromOrigin, getLength, add, scale } from 'source/common/geometry/D2/Vector.js'

const createInterpolationAutoTimer = ({
  func, // (rate) => {}, will get move distance in px
  queueTask = requestFrameUpdate,
  cancelTask = cancelFrameUpdate
}) => {
  let prevRate = 1 // range [0, 1]
  let timeStart = 0 // in ms
  let timeDuration = 0 // in ms

  const reset = () => {
    stop()
    prevRate = 1
    timeStart = 0
    timeDuration = 0
  }

  const { start: startTimer, stop, isActive } = createTimer({
    func: () => {
      prevRate = clamp((clock() - timeStart) / timeDuration, 0, 1)
      prevRate === 1 && reset() // done
      func(prevRate) // vector should move
    },
    queueTask,
    cancelTask
  })

  const start = (duration) => { // in sec
    if (duration <= 0) throw new Error(`[InterpolationAutoTimer] invalid nextDurationTime: ${duration}`)
    prevRate = 0
    timeStart = clock()
    timeDuration = duration * CLOCK_PER_SECOND
    startTimer()
  }

  return {
    stop,
    start,
    isActive,
    getRate: () => prevRate
  }
}

const createVectorAccumulator = (accumulatedTimeRange = 24) => { // in msec
  let accumulatedTimeVector = fromOrigin()
  let accumulatedTime = 0

  const reset = () => {
    accumulatedTimeVector = fromOrigin()
    accumulatedTime = 0
  }

  const accumulate = (vector, time) => { // time in msec
    if (time >= accumulatedTimeRange) {
      accumulatedTimeVector = scale(vector, accumulatedTimeRange)
      accumulatedTime = accumulatedTimeRange
    } else if (time + accumulatedTime <= accumulatedTimeRange) {
      accumulatedTimeVector = add(accumulatedTimeVector, scale(vector, time))
      accumulatedTime += time
    } else {
      const keepRate = accumulatedTime
        ? (accumulatedTimeRange - time) / accumulatedTime
        : 0
      accumulatedTimeVector = add(scale(accumulatedTimeVector, keepRate), scale(vector, time))
      accumulatedTime = accumulatedTime * keepRate + time
    }
    __DEV__ && console.log('[accumulate]', getLength(vector), vector, time, getAverageVector(), accumulatedTime)
  }

  const getAverageVector = () => accumulatedTime
    ? scale(accumulatedTimeVector, 1 / accumulatedTime)
    : fromOrigin()

  return {
    reset,
    accumulate,
    getAverageVector
  }
}

export {
  createInterpolationAutoTimer,
  createVectorAccumulator
}
