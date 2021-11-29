/** @typedef { * } EventHubData */
/** @typedef { (v: EventHubData) => void } EventHubListener */
/** @typedef { (EventHubListener) => void } EventHubListenerFunc */
/** @typedef { (v: EventHubData) => void } EventHubSendFunc */
/** @typedef { {
 *   clear: GetVoid,
 *   subscribe: EventHubListenerFunc,
 *   unsubscribe: EventHubListenerFunc,
 *   send: EventHubSendFunc
 * } } EventHub */
/** @type { () => EventHub } */
const createHub = () => {
  /** @type { Set<EventHubListener> } */
  const set = new Set()
  const clear = () => set.clear()
  /** @type { EventHubListenerFunc } */
  const subscribe = (listener) => { set.add(listener) }
  /** @type { EventHubListenerFunc } */
  const unsubscribe = (listener) => { set.delete(listener) }
  /** @type { EventHubSendFunc } */
  const send = (data) => set.forEach((listener) => listener(data))
  return { clear, subscribe, unsubscribe, send }
}

/** @typedef { (...v: *[]) => void } EventBaseListener */
/** @typedef { (type: string, listener: EventBaseListener) => void } SetEventBaseListener */
/** @typedef { {
 *   setMap: Map<string, Set<EventBaseListener>>,
 *   clear: GetVoid,
 *   on: SetEventBaseListener,
 *   off: SetEventBaseListener
 * } } EventBase - base type for EventTargetAlike & EventEmitterAlike */
/** @type { () => EventBase } */
const createEventBase = () => {
  /** @type { Map<string, Set<EventBaseListener>> } */
  const setMap = new Map()
  const clear = () => setMap.clear()
  /** @type { SetEventBaseListener } */
  const on = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet ? listenerSet.add(listener) : setMap.set(type, new Set([ listener ]))
  }
  /** @type { SetEventBaseListener } */
  const off = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet && listenerSet.delete(listener)
    listenerSet && listenerSet.size === 0 && setMap.delete(type)
  }
  return { setMap, clear, on, off }
}

// DOM 'EventTarget' style
// - clear()
// - dispatchEvent(event)
// - addEventListener(type, callback)
// - removeEventListener(type, callback)
/** @typedef { (v: Event) => void } EventTargetAlikeListener */
/** @typedef { (type: string, listener: EventTargetAlikeListener) => void } SetEventTargetAlikeListener */
/** @typedef { (v: Event) => void } EventTargetAlikeDispatchFunc */
/** @typedef { {
 *   clear: GetVoid,
 *   dispatchEvent: EventTargetAlikeDispatchFunc,
 *   addEventListener: SetEventTargetAlikeListener,
 *   removeEventListener: SetEventTargetAlikeListener
 * } } EventTargetAlike */
/** @type { () => EventTargetAlike } */
const createEventTarget = () => {
  const { setMap, clear, on, off } = createEventBase()
  /** @type { EventTargetAlikeDispatchFunc } */
  const dispatchEvent = (event) => {
    /** @type { Set<EventTargetAlikeListener> } */
    const listenerSet = setMap.get(event.type)
    listenerSet && listenerSet.forEach((listener) => listener(event))
  }
  return { clear, dispatchEvent, addEventListener: on, removeEventListener: off }
}

// node 'EventEmitter' style
// - clear()
// - emit(eventName[, ...args])
// - on(eventName, listener)
// - off(eventName, listener)
// - addListener(eventName, listener)
// - removeListener(eventName, listener)
// - removeAllListeners([eventName])
/** @typedef { (...v: *[]) => void } EventEmitterAlikeListener */
/** @typedef { (type: string, listener: EventEmitterAlikeListener) => void } SetEventEmitterAlikeListener */
/** @typedef { (...type: string[]) => void } RemoveEventEmitterAlikeListener */
/** @typedef { (type: string, ...v: *[]) => void } EmitEventEmitterAlike */
/** @typedef { {
 *   clear: GetVoid,
 *   emit: EmitEventEmitterAlike,
 *   on: SetEventEmitterAlikeListener,
 *   off: SetEventEmitterAlikeListener,
 *   addListener: SetEventEmitterAlikeListener,
 *   removeListener: SetEventEmitterAlikeListener,
 *   removeAllListeners: RemoveEventEmitterAlikeListener
 * } } EventEmitterAlike */
/** @type { () => EventEmitterAlike } */
const createEventEmitter = () => {
  const { setMap, clear, on, off } = createEventBase()
  /** @type { RemoveEventEmitterAlikeListener } */
  const removeAllListeners = (...eventNameList) => {
    if (!eventNameList.length) setMap.clear()
    else eventNameList.forEach((eventName) => setMap.delete(eventName))
  }
  /** @type { EmitEventEmitterAlike } */
  const emit = (eventName, ...args) => {
    /** @type { Set<EventEmitterAlikeListener> } */
    const listenerSet = setMap.get(eventName)
    listenerSet && listenerSet.forEach((listener) => listener(...args))
  }
  return { clear, emit, on, off, addListener: on, removeListener: off, removeAllListeners }
}

export { createHub, createEventTarget, createEventEmitter }
