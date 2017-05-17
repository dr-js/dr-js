import { now } from 'source/common/time'

const POINTER_EVENT_TYPE = {
  // basic
  START: 'pointerstart',
  MOVE: 'pointermove',
  END: 'pointerend',
  CANCEL: 'pointercancel',

  // extend
  EXT_START: 'EXT_START',
  EXT_HOLD: 'EXT_HOLD',
  EXT_DRAGGING: 'EXT_DRAGGING',
  EXT_DRAG: 'EXT_DRAG',
  EXT_CLICK: 'EXT_CLICK',
  EXT_CANCEL: 'EXT_CANCEL'

  // TODO: add gesture?
  // GESTURE_SCROLL: 'GESTURE_SCROLL',
  // GESTURE_ZOOM: 'GESTURE_ZOOM',
  // GESTURE_PAN: 'GESTURE_PAN',
}

const EVENT_TYPE_MAP = { // map touch/mouse event type to merged pointer event type
  touchstart: POINTER_EVENT_TYPE.START,
  touchmove: POINTER_EVENT_TYPE.MOVE,
  touchend: POINTER_EVENT_TYPE.END,
  touchcancel: POINTER_EVENT_TYPE.CANCEL,

  mousedown: POINTER_EVENT_TYPE.START,
  mousemove: POINTER_EVENT_TYPE.MOVE,
  mouseup: POINTER_EVENT_TYPE.END,
  mouseout: POINTER_EVENT_TYPE.CANCEL

  // TODO: add pen event?
}

function getDistance (pointA, pointB) {
  const dx = pointA.x - pointB.x
  const dy = pointA.y - pointB.y
  return Math.sqrt(dx * dx + dy * dy)
}

function parseEvent (event) {
  let pointerInfo = null
  if (event.touches) { // touch event
    if (event.targetTouches.length > 0) pointerInfo = event.targetTouches[ 0 ] // first touch point
    else if (event.changedTouches.length > 0) pointerInfo = event.changedTouches[ 0 ] // for touch end, where event.targetTouches is empty
    else throw new Error('[parseEvent] missing touch data')
  } else pointerInfo = event // mouse event
  const boundingRect = event.target.getBoundingClientRect()
  return {
    event,
    type: EVENT_TYPE_MAP[ event.type ],
    positionClient: { x: pointerInfo.clientX, y: pointerInfo.clientY },
    positionPage: { x: pointerInfo.pageX, y: pointerInfo.pageY },
    positionTarget: {
      x: pointerInfo.clientX - boundingRect.left, // OR: positionPage.x - event.target.offsetLeft, NEED CHECK offsetParent till null
      y: pointerInfo.clientY - boundingRect.top // OR: positionPage.y - event.target.offsetTop,
    }
  }
}

// event_ext_data = {
//   eventExtType: null,
//   isActive: false,
//   startTime: 0, // in second
//   positionStart: null, positionCurrent: null, positionPrev: null // relative to listener_element
// }

const DRAG_DISTANCE_THRESHOLD = (window.devicePixelRatio || 1) * 3
const HOLD_TIME_THRESHOLD = 0.5 // sec

function parseEventExt (eventExtData, eventData) {
  let eventExtType

  switch (eventData.type) {
    case POINTER_EVENT_TYPE.START:
      if (eventExtData.isActive !== false) throw new Error('[parseEventExt] START event with isActive != false')
      eventExtData.isActive = true
      eventExtData.startTime = now()
      eventExtData.positionStart = eventData.positionRelative
      eventExtData.positionCurrent = eventData.positionRelative
      eventExtType = POINTER_EVENT_TYPE.EXT_START
      break
    case POINTER_EVENT_TYPE.MOVE:
      if (eventExtData.isActive) {
        eventExtType = POINTER_EVENT_TYPE.EXT_DRAGGING
      }
      break
    case POINTER_EVENT_TYPE.END:
      if (eventExtData.isActive) {
        const distance = getDistance(eventExtData.positionStart, eventExtData.positionPrev)
        const deltaTime = now() - eventExtData.startTime
        if (distance >= DRAG_DISTANCE_THRESHOLD) eventExtType = POINTER_EVENT_TYPE.EXT_DRAG
        else if (deltaTime >= HOLD_TIME_THRESHOLD) eventExtType = POINTER_EVENT_TYPE.EXT_HOLD
        else eventExtType = POINTER_EVENT_TYPE.EXT_CLICK
        eventExtData.isActive = false
        eventExtData.startTime = 0
        eventExtData.positionStart = null
      }
      break
    case POINTER_EVENT_TYPE.CANCEL:
      eventExtType = POINTER_EVENT_TYPE.EXT_CANCEL
      eventExtData.isActive = false
      eventExtData.startTime = 0
      eventExtData.positionStart = null
      break
    default:
      throw new Error(`[parseEventExt] error type ${eventData.type}`)
  }

  eventExtData.eventExtType = eventExtType
  eventExtData.positionPrev = eventExtData.positionCurrent
  eventExtData.positionCurrent = eventData.positionRelative

  return eventExtData
}

// simple event wrapper, add all event in EVENT_TYPE_MAP
function applyPointerEventListener (element, callback) {
  const listener = (event) => callback(parseEvent(event, element))
  for (const eventType in EVENT_TYPE_MAP) element.addEventListener(eventType, listener, false)
  return () => { for (const eventType in EVENT_TYPE_MAP) element.removeEventListener(eventType, listener, false) }
}

function applyPointerEventExtListener (element, callback) {
  const eventExtData = {
    eventExtType: null,
    isActive: false,
    startTime: 0, // in second
    positionStart: null,
    positionCurrent: null,
    positionPrev: null // relative to element
  }
  const listener = (event) => {
    const eventData = parseEvent(event, element)
    const boundingRect = element.getBoundingClientRect()
    eventData.positionRelative = {
      x: eventData.positionClient.x - boundingRect.left,
      y: eventData.positionClient.y - boundingRect.top
    }
    parseEventExt(eventExtData, eventData)
    callback(eventExtData, eventData)
  }
  for (const eventType in EVENT_TYPE_MAP) element.addEventListener(eventType, listener, false)
  return () => { for (const eventType in EVENT_TYPE_MAP) element.removeEventListener(eventType, listener, false) }
}

export {
  POINTER_EVENT_TYPE,
  applyPointerEventListener,
  applyPointerEventExtListener
}
