/** @typedef { (data: any) => void } EHListener */
/** @typedef { {
 clear: () => void,
 subscribe: (listener: EHListener) => void,
 unsubscribe: (listener: EHListener) => void,
 send: (data: any) => void
 } } EventHub */
/** @type { () => EventHub } */
const createHub = () => {
  /** @type { Set<EHListener> } */
  const set = new Set()
  /** @type { EventHub['clear'] } */
  const clear = () => set.clear()
  /** @type { EventHub['subscribe'] } */
  const subscribe = (listener) => { set.add(listener) }
  /** @type { EventHub['unsubscribe'] } */
  const unsubscribe = (listener) => { set.delete(listener) }
  /** @type { EventHub['send'] } */
  const send = (data) => set.forEach((listener) => listener(data))
  return { clear, subscribe, unsubscribe, send }
}

/** @typedef { (...args: any[]) => void } EBListener */
/** @typedef { {
 setMap: Map<string, Set<EBListener>>,
 clear: () => void,
 on: (type: string, listener: EBListener) => void,
 off: (type: string, listener: EBListener) => void,
 } } EventBase - base type for EventTargetAlike & EventEmitterAlike */
/** @type { () => EventBase } */
const createEventBase = () => {
  const setMap = new Map()
  const clear = () => setMap.clear()
  /** @type { EventBase['on'] } */
  const on = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet ? listenerSet.add(listener) : setMap.set(type, new Set([ listener ]))
  }
  /** @type { EventBase['off'] } */
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
/** @typedef { { type: string } } ETAEvent */
/** @typedef { (event: ETAEvent) => void } ETAListener */
/** @typedef { {
 clear: () => void,
 dispatchEvent: (v: ETAEvent) => void,
 addEventListener: (type: string, listener: ETAListener) => void,
 removeEventListener: (type: string, listener: ETAListener) => void
 } } EventTargetAlike */
/** @type { () => EventTargetAlike } */
const createEventTarget = () => {
  const { setMap, clear, on, off } = createEventBase()
  /** @type { EventTargetAlike['dispatchEvent'] } */
  const dispatchEvent = (event) => {
    /** @type { Set<ETAListener> } */
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
/** @typedef { (...args: any[]) => void } EEAListener */
/** @typedef { {
 *   clear: () => void,
 *   emit: EEAListener,
 *   on: (type: string, listener: EEAListener) => void,
 *   off: (type: string, listener: EEAListener) => void,
 *   addListener: (type: string, listener: EEAListener) => void,
 *   removeListener: (type: string, listener: EEAListener) => void,
 *   removeAllListeners: (...eventNameList: string[]) => void
 * } } EventEmitterAlike */
/** @type { () => EventEmitterAlike } */
const createEventEmitter = () => {
  const { setMap, clear, on, off } = createEventBase()
  /** @type { EventEmitterAlike['removeAllListeners'] } */
  const removeAllListeners = (...eventNameList) => {
    if (!eventNameList.length) setMap.clear()
    else eventNameList.forEach((eventName) => setMap.delete(eventName))
  }
  /** @type { EventEmitterAlike['emit'] } */
  const emit = (eventName, ...args) => {
    /** @type { Set<EEAListener> } */
    const listenerSet = setMap.get(eventName)
    listenerSet && listenerSet.forEach((listener) => listener(...args))
  }
  return { clear, emit, on, off, addListener: on, removeListener: off, removeAllListeners }
}

export { createHub, createEventTarget, createEventEmitter }
