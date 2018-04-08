import { clock } from 'source/common/time'
import { getDist } from 'source/common/geometry/D2/Vector'
import { isContainPoint as isBoundingRectContainPoint } from 'source/common/geometry/D2/BoundingRect'

const POINTER_EVENT_TYPE = {
  START: 'START',
  MOVE: 'MOVE',
  END: 'END',
  CANCEL: 'CANCEL'
}

// TODO: Safari do not have PointerEvent yet, use mouse* + touch* event
// TODO: currently single pointer only
const applyPointerEventListener = ({
  element,
  onEvent,
  isGlobal = false,
  isCancel = true, // send cancel
  isCancelOnOutOfBound = true // send out of bound as cancel
}) => {
  if (!window.getComputedStyle(element).touchAction) throw new Error(`[applyPointerEventListener] should set CSS 'touch-action' to 'none' to prevent browser defaults`)

  const eventSource = isGlobal ? window.document : element
  isCancelOnOutOfBound = isCancel && isCancelOnOutOfBound

  // TODO: add custom function to record start state
  let timeStart
  let pointStart // relative to client/viewport
  let eventStart

  let prevEvent // basic memorize
  let prevState // basic memorize

  const reset = () => {
    timeStart = null
    pointStart = null
    eventStart = null

    prevEvent = null
    prevState = null

    eventSource.removeEventListener('pointermove', onMove)
    eventSource.removeEventListener('pointerup', onEnd)
    isCancel && eventSource.removeEventListener('pointercancel', onCancel)
    isCancelOnOutOfBound && eventSource.removeEventListener('pointerleave', onCancel)
  }

  const calcState = (event) => {
    if (__DEV__ && !timeStart) throw new Error(`[calcState] timeStart expected, get event: ${event.type}`) // TODO: check is needed
    if (__DEV__ && !event) throw new Error('[calcState] event expected')
    if (event !== prevEvent) {
      const { clientX, clientY } = event
      const time = clock()
      const point = { x: clientX, y: clientY }
      prevEvent = event
      prevState = {
        timeStart,
        pointStart,
        eventStart,
        time,
        point,
        duration: time - timeStart,
        distance: getDist(pointStart, point)
      }
    }
    return prevState
  }

  const onStart = (event) => {
    if (!event.isPrimary) return
    const { clientX, clientY } = event
    timeStart = clock()
    pointStart = { x: clientX, y: clientY }
    eventStart = event
    eventSource.addEventListener('pointermove', onMove)
    eventSource.addEventListener('pointerup', onEnd)
    isCancel && eventSource.addEventListener('pointercancel', onCancel)
    isCancelOnOutOfBound && eventSource.addEventListener('pointerleave', onCancel)
    onEvent(POINTER_EVENT_TYPE.START, event, calcState)
  }
  const onMove = (event) => {
    if (!event.isPrimary) return
    const { point } = calcState(event)
    if (
      isCancelOnOutOfBound &&
      !isBoundingRectContainPoint(element.getBoundingClientRect(), point)
    ) return onCancel(event)
    onEvent(POINTER_EVENT_TYPE.MOVE, event, calcState)
  }
  const onEnd = (event) => {
    if (!event.isPrimary) return
    onEvent(POINTER_EVENT_TYPE.END, event, calcState)
    reset()
  }
  const onCancel = (event) => {
    if (!event.isPrimary) return
    onEvent(POINTER_EVENT_TYPE.CANCEL, event, calcState)
    reset()
  }

  element.addEventListener('pointerdown', onStart)
  reset()
  return () => {
    element.removeEventListener('pointerdown', onStart)
    reset()
  }
}

const ENHANCED_POINTER_EVENT_TYPE = {
  TAP: 'TAP',
  HOLD: 'HOLD',
  DRAG_MOVE: 'DRAG_MOVE',
  DRAG_END: 'DRAG_END',
  DRAG_CANCEL: 'DRAG_CANCEL'
}

const applyEnhancedPointerEventListener = ({
  element,
  onEnhancedEvent,
  onEvent, // optional, for original PointerEvent
  holdDurationThreshold = 500, // in msec
  dragDistanceThreshold = 5, // in px
  ...extraOption
}) => {
  let isDragging = false

  const enhancedOnEvent = (name, event, calcState) => {
    const eventState = calcState(event) // TODO: check eventState, should not be null
    switch (name) {
      case POINTER_EVENT_TYPE.START:
        isDragging = false
        break
      case POINTER_EVENT_TYPE.MOVE:
        isDragging |= eventState.distance >= dragDistanceThreshold
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_MOVE, event, eventState)
        break
      case POINTER_EVENT_TYPE.END:
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_END, event, eventState)
        else if (eventState.duration >= holdDurationThreshold) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.HOLD, event, eventState)
        else onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.TAP, event, eventState)
        break
      case POINTER_EVENT_TYPE.CANCEL:
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_CANCEL, event, eventState)
        break
    }
    onEvent && onEvent(name, event, calcState)
  }

  return applyPointerEventListener({ element, onEvent: enhancedOnEvent, ...extraOption })
}

export {
  POINTER_EVENT_TYPE,
  applyPointerEventListener,

  ENHANCED_POINTER_EVENT_TYPE,
  applyEnhancedPointerEventListener
}
