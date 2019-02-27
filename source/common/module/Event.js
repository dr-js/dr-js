const createHub = () => {
  const set = new Set()
  const clear = () => set.clear()
  const subscribe = (listener) => { set.add(listener) }
  const unsubscribe = (listener) => { set.delete(listener) }
  const send = (data) => set.forEach((listener) => listener(data))
  return { clear, subscribe, unsubscribe, send }
}

const createEventBase = () => {
  const setMap = new Map()
  const clear = () => setMap.clear()
  const on = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet ? listenerSet.add(listener) : setMap.set(type, new Set([ listener ]))
  }
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
const createEventTarget = () => {
  const { setMap, clear, on, off } = createEventBase()
  const dispatchEvent = (event) => {
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
const createEventEmitter = () => {
  const { setMap, clear, on, off } = createEventBase()
  const removeAllListeners = (...eventNameList) => {
    if (!eventNameList.length) setMap.clear()
    else eventNameList.forEach((eventName) => setMap.delete(eventName))
  }
  const emit = (eventName, ...args) => {
    const listenerSet = setMap.get(eventName)
    listenerSet && listenerSet.forEach((listener) => listener(...args))
  }
  return { clear, emit, on, off, addListener: on, removeListener: off, removeAllListeners }
}

export { createHub, createEventTarget, createEventEmitter }
