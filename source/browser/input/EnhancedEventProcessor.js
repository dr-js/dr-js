import { CLOCK_TO_SECOND } from 'source/common/time'
import { createMotionAutoTimer, createVectorAccumulator } from 'source/browser/module/MotionAutoTimer'
import { fromOrigin, add, sub, getLength, scale } from 'source/common/geometry/D2/Vector'
import { POINTER_EVENT_TYPE, ENHANCED_POINTER_EVENT_TYPE } from './PointerEvent'

const { START } = POINTER_EVENT_TYPE
const { DRAG_MOVE, DRAG_END, DRAG_CANCEL } = ENHANCED_POINTER_EVENT_TYPE

const createScrollEnhancedEventProcessor = ({
  updateOrigin,
  getOrigin = fromOrigin,
  normalizeVector = (vector) => vector, // can lock result direction
  accelerateScalar, // should be negative
  accumulatedTimeRange
}) => {
  let isPause = false
  let pointOrigin
  let exitDirection
  let prevTime
  let prevPoint

  const { stop, start } = createMotionAutoTimer({
    func: (distance) => {
      const deltaVector = scale(exitDirection, distance)
      __DEV__ && console.log('[update] deltaVector:', deltaVector)
      pointOrigin = add(pointOrigin, deltaVector)
      updateOrigin(pointOrigin)
    },
    accelerateScalar
  })

  const { reset: resetVectorAccumulator, accumulate, getAverageVector } = createVectorAccumulator(accumulatedTimeRange)

  const reset = () => {
    stop()
    resetVectorAccumulator()
    isPause = false
    pointOrigin = undefined
    exitDirection = undefined
    prevTime = undefined
    prevPoint = undefined
  }

  const pause = () => {
    reset()
    isPause = true
  }

  return {
    reset,
    pause,
    onEnhancedEvent: (name, event, eventState) => {
      if (isPause || !(name === DRAG_END || name === DRAG_CANCEL || name === DRAG_MOVE)) return

      const { timeStart, pointStart, time, point } = eventState
      const deltaVector = normalizeVector(sub(point, pointStart))
      const pointCurrent = add(pointOrigin, deltaVector)
      __DEV__ && console.log('[onEnhancedEvent] deltaVector:', deltaVector)
      updateOrigin(pointCurrent)

      const duration = time - (prevTime || timeStart)
      const vector = scale(normalizeVector(sub(point, prevPoint || pointStart)), 1 / (duration * CLOCK_TO_SECOND))
      accumulate(vector, duration)

      prevTime = time
      prevPoint = point

      if (name !== DRAG_END && name !== DRAG_CANCEL) return
      const exitVector = normalizeVector(getAverageVector())
      const exitSpeed = getLength(exitVector)
      pointOrigin = pointCurrent
      exitDirection = scale(exitVector, 1 / exitSpeed)
      start(exitSpeed, Infinity) // apply exit speed
      __DEV__ && console.log('[onEnhancedEvent] exitSpeed:', exitSpeed)
    },
    onEvent: (name, event) => {
      event.preventDefault()
      if (isPause || name !== START) return
      reset()
      pointOrigin = getOrigin()
      __DEV__ && console.log('[onEvent] pointOrigin:', pointOrigin)
    }
  }
}

const createSwipeEnhancedEventProcessor = ({
  updateOrigin,
  getOrigin = fromOrigin,
  getTarget = ({ pointCurrent, pointOrigin, exitVector, exitSpeed }) => pointOrigin,
  normalizeVector = (vector) => vector, // can lock result direction
  accelerateScalar, // should be positive
  accumulatedTimeRange
}) => {
  let isPause = false
  let pointOrigin
  let exitDirection
  let prevTime
  let prevPoint

  const { stop, start } = createMotionAutoTimer({
    func: (distance) => {
      const deltaVector = scale(exitDirection, distance)
      __DEV__ && console.log('[update] deltaVector:', deltaVector, distance)
      pointOrigin = add(pointOrigin, deltaVector)
      updateOrigin(pointOrigin)
    },
    accelerateScalar
  })

  const { reset: resetVectorAccumulator, accumulate, getAverageVector } = createVectorAccumulator(accumulatedTimeRange)

  const reset = () => {
    stop()
    resetVectorAccumulator()
    isPause = false
    pointOrigin = undefined
    exitDirection = undefined
    prevTime = undefined
    prevPoint = undefined
  }

  const pause = () => {
    reset()
    isPause = true
  }

  return {
    reset,
    pause,
    onEnhancedEvent: (name, event, eventState) => {
      if (isPause || !(name === DRAG_END || name === DRAG_CANCEL || name === DRAG_MOVE)) return

      const { timeStart, pointStart, time, point } = eventState
      const deltaVector = normalizeVector(sub(point, pointStart))
      const pointCurrent = add(pointOrigin, deltaVector)
      __DEV__ && console.log('[onEnhancedEvent] deltaVector:', deltaVector)
      updateOrigin(pointCurrent)

      const duration = time - (prevTime || timeStart)
      const vector = scale(normalizeVector(sub(point, prevPoint || pointStart)), 1 / (duration * CLOCK_TO_SECOND))
      accumulate(vector, duration)

      prevTime = time
      prevPoint = point

      if (name !== DRAG_END && name !== DRAG_CANCEL) return
      const exitVector = normalizeVector(getAverageVector())
      const exitSpeed = getLength(exitVector)
      const pointTarget = getTarget({ pointCurrent, pointOrigin, exitVector, exitSpeed })
      const targetVector = sub(pointTarget, pointCurrent)
      const targetDistance = getLength(targetVector)
      __DEV__ && console.log('[onEnhancedEvent]', { targetVector, targetDistance, exitSpeed })
      if (!targetDistance) return
      pointOrigin = pointCurrent
      exitDirection = scale(targetVector, 1 / targetDistance)
      start(exitSpeed, targetDistance) // apply exit speed
    },
    onEvent: (name, event) => {
      event.preventDefault()
      if (isPause || name !== START) return
      reset()
      pointOrigin = getOrigin()
      __DEV__ && console.log('[onEvent] pointOrigin:', pointOrigin)
    }
  }
}

export {
  createScrollEnhancedEventProcessor,
  createSwipeEnhancedEventProcessor
}
