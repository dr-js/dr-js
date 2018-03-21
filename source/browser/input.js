import { clock } from 'source/common/time'
import { getRandomId } from 'source/common/math/random'
import { isObjectContain } from 'source/common/check'
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
  isCancelOnOutOfBound = true
}) => {
  if (!window.getComputedStyle(element).touchAction) throw new Error(`[applyPointerEventListener] should set CSS 'touch-action' to 'none' to prevent browser defaults`)

  const eventSource = isGlobal ? window.document : element

  // TODO: add custom function to record start state
  let timeStart = null
  let pointStart = null // relative to client/viewport
  let eventStart = null

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
    isCancel && eventSource.removeEventListener('pointerleave', onCancel) // TODO: should check in onMove, Chrome may not fire leave for touch
  }

  const calcState = (event) => {
    if (__DEV__ && !timeStart) throw new Error(`[calcState] timeStart expected, get event: ${event.type}`) // TODO: check this
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
    isCancel && eventSource.addEventListener('pointerleave', onCancel)
    onEvent(POINTER_EVENT_TYPE.START, event, calcState)
  }
  const onMove = (event) => {
    if (!event.isPrimary) return
    const { point } = calcState(event)
    if (
      isCancel &&
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
  return () => {
    element.removeEventListener('pointerdown', onStart)
    reset()
  }
}

const ENHANCED_POINTER_EVENT_TYPE = {
  ...POINTER_EVENT_TYPE,
  TAP: 'TAP',
  HOLD: 'HOLD',
  DRAG_MOVE: 'DRAG_MOVE',
  DRAG_END: 'DRAG_END',
  DRAG_CANCEL: 'DRAG_CANCEL'
}

// TODO: touch action do not get pointercancel when
const DEFAULT_HOLD_DURATION_THRESHOLD = 500 // in msec
const DEFAULT_DRAG_DISTANCE_THRESHOLD = 5 // in px
const applyPointerEnhancedEventListener = ({
  element,
  onEnhancedEvent,
  onEvent,
  isGlobal = false,
  isCancel = true,
  isCancelOnOutOfBound = true,
  holdDurationThreshold = DEFAULT_HOLD_DURATION_THRESHOLD,
  dragDistanceThreshold = DEFAULT_DRAG_DISTANCE_THRESHOLD
}) => {
  let isDragging = false
  return applyPointerEventListener({
    element,
    onEvent: (name, event, calcState) => {
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
    },
    isGlobal,
    isCancel,
    isCancelOnOutOfBound
  })
}

// TODO: single key, not key sequence
const createKeyCommandListener = (eventSource = window.document) => {
  const keyCommandMap = new Map()
  const keyCommandListener = (event) => keyCommandMap.forEach((keyCommand) => {
    const { target, checkMap, callback } = keyCommand
    if (target && !target.contains(event.target)) return
    if (!isObjectContain(event, checkMap)) return
    event.preventDefault()
    callback(event, keyCommand)
  })
  const clear = () => eventSource.removeEventListener('keydown', keyCommandListener)
  const addKeyCommand = ({ id = getRandomId(), target, checkMap, callback }) => {
    keyCommandMap.set(id, { id, target, checkMap, callback })
    return id
  }
  const deleteKeyCommand = ({ id }) => keyCommandMap.delete(id)
  eventSource.addEventListener('keydown', keyCommandListener)
  return { clear, addKeyCommand, deleteKeyCommand }
}

export {
  POINTER_EVENT_TYPE,
  applyPointerEventListener,

  ENHANCED_POINTER_EVENT_TYPE,
  applyPointerEnhancedEventListener,

  createKeyCommandListener
}
