import { CLOCK_PER_SECOND } from 'source/common/time.js'
import { linear } from 'source/common/math/easing.js'
import { add, sub, getLength, scale, lerp } from 'source/common/geometry/D2/Vector.js'
import { createInterpolationAutoTimer, createVectorAccumulator } from 'source/browser/module/MotionAutoTimer.js'
import { POINTER_EVENT_TYPE, ENHANCED_POINTER_EVENT_TYPE } from './PointerEvent.js'

const { START } = POINTER_EVENT_TYPE
const { DRAG_MOVE, DRAG_END, DRAG_CANCEL } = ENHANCED_POINTER_EVENT_TYPE

const createSwipeEnhancedEventProcessor = ({
  getPointStart, // (eventState) => pointStart
  updatePoint, // (pointCurrent, eventState || undefined) => {}
  getExitInfo, // ({ exitVector, pointCurrent, pointStart }) => ({ pointExit: pointCurrent, exitDuration: 0 }),
  normalizeVector = (vector) => vector, // can lock result direction
  timeFunction = linear,
  accumulatedTimeRange
}) => {
  let isPause = false
  let pointStart
  let pointExit
  let prevTime
  let prevPoint

  const { stop, start } = createInterpolationAutoTimer({ func: (rate) => updatePoint(lerp(pointStart, pointExit, timeFunction(rate))) })

  const { reset: resetVectorAccumulator, accumulate, getAverageVector } = createVectorAccumulator(accumulatedTimeRange)

  const reset = () => {
    stop()
    resetVectorAccumulator()
    isPause = false
    pointStart = undefined
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
    onEnhancedEvent: (name, eventState) => {
      // __DEV__ && window.log('onEnhancedEvent', name)
      if (isPause || !(name === DRAG_END || name === DRAG_CANCEL || name === DRAG_MOVE)) return

      const { timeStart, pointStart: eventPointStart, time, point } = eventState
      const pointCurrent = add(pointStart, normalizeVector(sub(point, eventPointStart)))
      __DEV__ && console.log('[onEnhancedEvent]', { pointCurrent })
      updatePoint(pointCurrent, eventState)

      const duration = time - (prevTime || timeStart)
      accumulate(scale(normalizeVector(sub(point, prevPoint || pointStart)), CLOCK_PER_SECOND / duration), duration)

      prevTime = time
      prevPoint = point
      if (name === DRAG_MOVE) return

      const exitVector = normalizeVector(getAverageVector())
      const { pointExit: nextPointExit, exitDuration } = getExitInfo({ exitVector, pointCurrent, pointStart })
      if (!exitDuration) return

      pointStart = pointCurrent
      pointExit = nextPointExit
      __DEV__ && console.log('[onEnhancedEvent] startExit', { exitVector, exitDuration, exitSpeed: getLength(exitVector), pointExit })
      start(exitDuration)
    },
    onEvent: (name, event, calcState) => {
      if (isPause || name !== START) return
      reset()
      pointStart = getPointStart(calcState(event))
      __DEV__ && console.log('[onEvent]', { pointStart })
    }
  }
}

export { createSwipeEnhancedEventProcessor }
