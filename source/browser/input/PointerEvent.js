import { clock } from 'source/common/time'
import { getDist } from 'source/common/geometry/D2/Vector'
import { isContainPoint as isBoundingRectContainPoint } from 'source/common/geometry/D2/BoundingRect'

const { document, getComputedStyle, TouchEvent } = window

const POINTER_EVENT_TYPE = {
  START: 'START',
  MOVE: 'MOVE',
  END: 'END',
  CANCEL: 'CANCEL'
}

// TODO: currently single pointer only
const applyPointerEventListener = ({
  element,
  onEvent, // (type, event, calcState) => {}
  isGlobal = false,
  isCancel = true, // send cancel
  isCancelOnOutOfBound = true, // send out of bound as cancel
  isUseTouchEvent = true // TODO: when touch trigger browser scroll, pointer will be cancelled, so to still get a drag, both Pointer & Touch will be listened
}) => {
  !getComputedStyle(element).touchAction && console.warn('[applyPointerEventListener] should set CSS "touch-action" to "none" to prevent browser defaults')

  const eventSource = isGlobal ? document : element
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

    isUseTouchEvent && eventSource.removeEventListener('touchmove', onMove, { passive: false })
    isUseTouchEvent && eventSource.removeEventListener('touchend', onEnd)
    isUseTouchEvent && isCancel && eventSource.removeEventListener('touchcancel', onCancel)
  }

  const getEventPointClient = (event) => ({ x: event.clientX, y: event.clientY })
  const getEventPointTouch = (event) => {
    if (!(event instanceof TouchEvent)) return { x: event.clientX, y: event.clientY }
    return event.touches.length
      ? { x: event.touches[ 0 ].clientX, y: event.touches[ 0 ].clientY }
      : { x: event.changedTouches[ 0 ].clientX, y: event.changedTouches[ 0 ].clientY }
  }
  const getEventPoint = (!isUseTouchEvent || !TouchEvent)
    ? getEventPointClient
    : getEventPointTouch

  const calcState = (event) => {
    if (__DEV__ && !timeStart) throw new Error(`[calcState] expect timeStart, get event: ${event.type}`)
    if (__DEV__ && !event) throw new Error('[calcState] expect event')
    if (event !== prevEvent) {
      const time = clock()
      const point = getEventPoint(event)
      prevEvent = event
      prevState = {
        timeStart,
        pointStart,
        eventStart,
        time,
        point,
        event,
        duration: time - timeStart,
        distance: getDist(pointStart, point)
      }
    }
    return prevState
  }

  const checkShouldPass = (!isUseTouchEvent || !TouchEvent)
    ? (event) => !event.isPrimary
    : (event) => (event instanceof TouchEvent)
      ? (
        (event.type === 'touchend' || event.type === 'touchcancel')
          ? event.touches.length !== 0
          : event.touches.length !== 1
      )
      : (!event.isPrimary || event.pointerType === 'touch')

  const onStart = (event) => {
    if (checkShouldPass(event)) return
    timeStart = clock()
    pointStart = getEventPoint(event)
    eventStart = event

    eventSource.addEventListener('pointermove', onMove)
    eventSource.addEventListener('pointerup', onEnd)
    isCancel && eventSource.addEventListener('pointercancel', onCancel)
    isCancelOnOutOfBound && eventSource.addEventListener('pointerleave', onCancel)

    isUseTouchEvent && eventSource.addEventListener('touchmove', onMove, { passive: false })
    isUseTouchEvent && eventSource.addEventListener('touchend', onEnd)
    isUseTouchEvent && isCancel && eventSource.addEventListener('touchcancel', onCancel)

    onEvent(POINTER_EVENT_TYPE.START, event, calcState)
  }
  const onMove = (event) => {
    if (checkShouldPass(event)) return
    const { point } = calcState(event)
    if (
      isCancelOnOutOfBound &&
      !isBoundingRectContainPoint(element.getBoundingClientRect(), point)
    ) return onCancel(event)
    onEvent(POINTER_EVENT_TYPE.MOVE, event, calcState)
  }
  const onEnd = (event) => {
    if (checkShouldPass(event)) return
    onEvent(POINTER_EVENT_TYPE.END, event, calcState)
    reset()
  }
  const onCancel = (event) => {
    if (checkShouldPass(event)) return
    onEvent(POINTER_EVENT_TYPE.CANCEL, event, calcState)
    reset()
  }

  element.addEventListener('pointerdown', onStart)
  isUseTouchEvent && element.addEventListener('touchstart', onStart, { passive: false })
  reset()
  return () => {
    element.removeEventListener('pointerdown', onStart)
    isUseTouchEvent && element.removeEventListener('touchstart', onStart, { passive: false })
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
  onEnhancedEvent, // (type, eventState) => {}
  onEvent, // (type, event, calcState) => {}, optional, for original PointerEvent
  holdDurationThreshold = 500, // in msec
  dragDistanceThreshold = 5, // in px
  ...extraOption
}) => {
  let isDragging = false

  const enhancedOnEvent = (name, event, calcState) => {
    const eventState = calcState(event)
    switch (name) {
      case POINTER_EVENT_TYPE.START:
        isDragging = false
        break
      case POINTER_EVENT_TYPE.MOVE:
        isDragging |= eventState.distance >= dragDistanceThreshold
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_MOVE, eventState)
        break
      case POINTER_EVENT_TYPE.END:
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_END, eventState)
        else if (eventState.duration >= holdDurationThreshold) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.HOLD, eventState)
        else onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.TAP, eventState)
        break
      case POINTER_EVENT_TYPE.CANCEL:
        if (isDragging) onEnhancedEvent(ENHANCED_POINTER_EVENT_TYPE.DRAG_CANCEL, eventState)
        break
    }
    onEvent && onEvent(name, event, calcState)
  }

  return applyPointerEventListener({ onEvent: enhancedOnEvent, ...extraOption })
}

export {
  POINTER_EVENT_TYPE,
  applyPointerEventListener,

  ENHANCED_POINTER_EVENT_TYPE,
  applyEnhancedPointerEventListener
}
