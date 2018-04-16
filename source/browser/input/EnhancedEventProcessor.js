import { CLOCK_PER_SECOND } from 'source/common/time'
import { linear } from 'source/common/math/easing'
import { add, sub, getLength, scale, lerp } from 'source/common/geometry/D2/Vector'
import { createInterpolationAutoTimer, createVectorAccumulator } from 'source/browser/module/MotionAutoTimer'

import { POINTER_EVENT_TYPE, ENHANCED_POINTER_EVENT_TYPE } from './PointerEvent'

const { START } = POINTER_EVENT_TYPE
const { DRAG_MOVE, DRAG_END, DRAG_CANCEL } = ENHANCED_POINTER_EVENT_TYPE

const createSwipeEnhancedEventProcessor = ({
  getOrigin, // (event) => pointOrigin
  updateOrigin, // (pointCurrent) => {}
  getExitInfo, // ({ exitVector, pointCurrent, pointOrigin }) => ({ pointExit: pointCurrent, exitDuration: 0 }),
  normalizeVector = (vector) => vector, // can lock result direction
  timeFunction = linear,
  accumulatedTimeRange
}) => {
  let isPause = false
  let pointOrigin
  let pointExit
  let prevTime
  let prevPoint

  const { stop, start } = createInterpolationAutoTimer({ func: (rate) => updateOrigin(lerp(pointOrigin, pointExit, timeFunction(rate))) })

  const { reset: resetVectorAccumulator, accumulate, getAverageVector } = createVectorAccumulator(accumulatedTimeRange)

  const reset = () => {
    stop()
    resetVectorAccumulator()
    isPause = false
    pointOrigin = undefined
    pointExit = undefined
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
      const pointCurrent = add(pointOrigin, normalizeVector(sub(point, pointStart)))
      __DEV__ && console.log('[onEnhancedEvent]', { pointCurrent })
      updateOrigin(pointCurrent)

      const duration = time - (prevTime || timeStart)
      accumulate(scale(normalizeVector(sub(point, prevPoint || pointStart)), CLOCK_PER_SECOND / duration), duration)

      prevTime = time
      prevPoint = point
      if (name === DRAG_MOVE) return

      const exitVector = normalizeVector(getAverageVector())
      const { pointExit: nextPointExit, exitDuration } = getExitInfo({ exitVector, pointCurrent, pointOrigin })
      if (!exitDuration) return

      pointOrigin = pointCurrent
      pointExit = nextPointExit
      __DEV__ && console.log('[onEnhancedEvent] startExit', { exitVector, exitDuration, exitSpeed: getLength(exitVector), pointExit })
      start(exitDuration)
    },
    onEvent: (name, event) => {
      if (isPause || name !== START) return
      reset()
      pointOrigin = getOrigin(event)
      __DEV__ && console.log('[onEvent]', { pointOrigin })
    }
  }
}

export { createSwipeEnhancedEventProcessor }
