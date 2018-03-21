const createHub = () => {
  let set = new Set()
  const clear = () => set.clear()
  const subscribe = (listener) => { set.add(listener) }
  const unsubscribe = (listener) => { set.delete(listener) }
  const send = (data) => set.forEach((listener) => listener(data))
  return { clear, subscribe, unsubscribe, send }
}

const createEventBase = () => {
  const setMap = new Map()
  const clear = () => setMap.clear()
  const addListener = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet ? listenerSet.add(listener) : setMap.set(type, new Set([ listener ]))
  }
  const removeListener = (type, listener) => {
    const listenerSet = setMap.get(type)
    listenerSet && listenerSet.delete(listener)
    listenerSet && listenerSet.size === 0 && setMap.delete(type)
  }
  return { setMap, clear, addListener, removeListener }
}

// DOM 'EventTarget' style
// addEventListener(type, callback)
// removeEventListener(type, callback)
// dispatchEvent(event)
const createEventTarget = () => {
  const { setMap, clear, addListener: addEventListener, removeListener: removeEventListener } = createEventBase()
  const dispatchEvent = (event) => {
    const listenerSet = setMap.get(event.type)
    listenerSet && listenerSet.forEach((listener) => listener(event))
  }
  return { clear, addEventListener, removeEventListener, dispatchEvent }
}

// node 'EventEmitter' style
// emitter.addListener(eventName, listener)
// emitter.removeListener(eventName, listener)
// emitter.removeAllListeners([eventName])
// emitter.emit(eventName[, ...args])
// emitter.on(eventName, listener)
const createEventEmitter = () => {
  const { setMap, clear, addListener, removeListener } = createEventBase()
  const removeAllListeners = (...eventNameList) => {
    if (!eventNameList.length) setMap.clear()
    else eventNameList.forEach((eventName) => setMap.delete(eventName))
  }
  const emit = (eventName, ...args) => {
    const listenerSet = setMap.get(eventName)
    listenerSet && listenerSet.forEach((listener) => listener(...args))
  }
  return { clear, addListener, removeListener, removeAllListeners, emit, on: addListener }
}

export { createHub, createEventTarget, createEventEmitter }
