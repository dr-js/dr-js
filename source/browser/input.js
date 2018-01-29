import { clock } from 'source/common/time'
import { getRandomId } from 'source/common/math'
import { isObjectContain } from 'source/common/data/__utils__'
import { getDist } from 'source/common/geometry/D2/vector'
import { isContainPoint as isBoundingRectContainPoint } from 'source/common/geometry/D2/boundingRect'

// TODO: Safari do not have PointerEvent yet, use mouse* + touch* event
// TODO: currently single pointer only
const applyPointerEventListener = ({ element, onEvent }) => {
  if (!element.style.touchAction) throw new Error(`[applyPointerEventListener] should set CSS 'touch-action' to 'none' to prevent browser defaults`)

  let timeStart = null
  let pointStart = null // relative to client/viewport

  const reset = () => {
    timeStart = null
    pointStart = null // relative to client/viewport
    element.removeEventListener('pointermove', onMove)
    element.removeEventListener('pointerup', onEnd)
    element.removeEventListener('pointercancel', onCancel)
    element.removeEventListener('pointerleave', onCancel) // TODO: should check in onMove, Chrome may not fire leave for touch
  }

  // basic memorize
  let prevEvent
  let prevState
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
        time,
        duration: time - timeStart,
        pointStart,
        point,
        distance: getDist(pointStart, point),
        element,
        elementRect: element.getBoundingClientRect()
      }
    }
    return prevState
  }

  const onStart = (event) => {
    if (!event.isPrimary) return
    const { clientX, clientY } = event
    timeStart = clock()
    pointStart = { x: clientX, y: clientY }
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onEnd)
    element.addEventListener('pointercancel', onCancel)
    element.addEventListener('pointerleave', onCancel)
    onEvent('START', event, calcState)
  }
  const onMove = (event) => {
    if (!event.isPrimary) return
    const { point, elementRect } = calcState(event)
    if (!isBoundingRectContainPoint(elementRect, point)) return onCancel(event)
    onEvent('MOVE', event, calcState)
  }
  const onEnd = (event) => {
    if (!event.isPrimary) return
    onEvent('END', event, calcState)
    reset()
  }
  const onCancel = (event) => {
    if (!event.isPrimary) return
    onEvent('CANCEL', event, calcState)
    reset()
  }

  element.addEventListener('pointerdown', onStart)
  return () => {
    element.removeEventListener('pointerdown', onStart)
    reset()
  }
}

// TODO: touch action do not get pointercancel when
const DEFAULT_HOLD_DURATION_THRESHOLD = 500 // in msec
const DEFAULT_DRAG_DISTANCE_THRESHOLD = 5 // in px
const applyPointerEnhancedEventListener = ({
  element,
  onEnhancedEvent,
  onEvent,
  holdDurationThreshold = DEFAULT_HOLD_DURATION_THRESHOLD,
  dragDistanceThreshold = DEFAULT_DRAG_DISTANCE_THRESHOLD
}) => {
  let isDragging = false
  return applyPointerEventListener({
    element,
    onEvent: (name, event, calcState) => {
      const eventState = calcState(event)

      // TODO: check eventState, should not be null
      if (name === 'START') {
        isDragging = false
      } else if (name === 'MOVE') {
        isDragging |= eventState.distance >= dragDistanceThreshold
        if (isDragging) onEnhancedEvent('DRAG_MOVE', event, eventState)
      } else if (name === 'END') {
        if (isDragging) onEnhancedEvent('DRAG_END', event, eventState)
        else if (eventState.duration >= holdDurationThreshold) onEnhancedEvent('HOLD', event, eventState)
        else onEnhancedEvent('TAP', event, eventState)
      } else if (name === 'CANCEL') {
        if (isDragging) onEnhancedEvent('DRAG_CANCEL', event, eventState)
      }

      onEvent(name, event, calcState)
    }
  })
}

// TODO: single key, not key sequence
const createKeyCommandListener = (element = window.document) => {
  const keyCommandMap = new Map()
  const keyCommandListener = (event) => keyCommandMap.forEach((keyCommand) => {
    const { target, checkMap, callback } = keyCommand
    if (target && !target.contains(event.target)) return
    if (!isObjectContain(event, checkMap)) return
    event.preventDefault()
    callback(event, keyCommand)
  })
  const clear = () => element.removeEventListener('keydown', keyCommandListener)
  const addKeyCommand = ({ id = getRandomId(), target, checkMap, callback }) => {
    keyCommandMap.set(id, { id, target, checkMap, callback })
    return id
  }
  const deleteKeyCommand = ({ id }) => keyCommandMap.delete(id)
  element.addEventListener('keydown', keyCommandListener)
  return { clear, addKeyCommand, deleteKeyCommand }
}

export {
  applyPointerEventListener,
  applyPointerEnhancedEventListener,
  createKeyCommandListener
}
