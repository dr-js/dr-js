import { CLOCK_TO_SECOND, clock, createTimer, requestFrameUpdate, cancelFrameUpdate } from 'source/common/time'
import { fromOrigin, add, scale } from 'source/common/geometry/D2/Vector'

const createMotionAutoTimer = ({
  func, // (move) => {}, will get move distance in px
  accelerateScalar = Infinity, // should be px/sec^2
  queueTask = requestFrameUpdate,
  cancelTask = cancelFrameUpdate
}) => {
  let speed = 0 // in px/sec
  let distance = 0 // in px/sec
  let prevTime = 0 // in ms

  const reset = () => {
    stop()
    speed = 0
    distance = 0
    prevTime = 0
  }

  const { start: startTimer, stop, isActive } = createTimer({
    func: () => {
      const time = clock()
      const deltaTime = (time - prevTime) * CLOCK_TO_SECOND
      const nextSpeed = Math.max(0, speed + deltaTime * accelerateScalar)
      const move = nextSpeed * deltaTime
      const nextDistance = Math.max(0, distance - move)
      __DEV__ && console.log({ prevTime, deltaTime, speed, distance, nextSpeed, nextDistance, move })

      speed = nextSpeed
      distance = nextDistance
      prevTime = time
      if (speed === 0 || distance === 0) reset() // done

      func(move) // vector should move
    },
    queueTask,
    cancelTask
  })

  const start = (nextSpeed, nextDistance = Infinity) => { // in px/sec
    if (nextSpeed <= 0 || nextDistance <= 0) return // TODO: calc if there is a end condition
    speed = nextSpeed
    distance = nextDistance
    prevTime = clock()
    startTimer()
  }

  return {
    stop,
    start,
    isActive,
    getSpeed: () => speed,
    getDistance: () => distance
  }
}

const createVectorAccumulator = (accumulatedTimeRange = 32) => { // in msec
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
    __DEV__ && console.log('[accumulate]', getAverageVector(), { accumulatedTime, vector, time })
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
  createMotionAutoTimer,
  createVectorAccumulator
}
