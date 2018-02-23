// DOM 'EventTarget' style
// addEventListener(type, callback)
// removeEventListener(type, callback)
// dispatchEvent(event)

class EventTarget {
  constructor () {
    this.listenerSetMap = new Map()
  }

  addEventListener (type, listener) {
    if (!this.listenerSetMap.has(type)) this.listenerSetMap.set(type, new Set([ listener ]))
    else this.listenerSetMap.get(type).add(listener)
  }

  removeEventListener (type, listener) {
    if (!this.listenerSetMap.has(type)) return
    const listenerSet = this.listenerSetMap.get(type)
    if (!listenerSet.has(listener)) return
    listenerSet.delete(listener)
    if (listenerSet.size === 0) this.listenerSetMap.delete(type)
  }

  dispatchEvent (event) {
    if (!this.listenerSetMap.has(event.type)) return
    const listenerSet = this.listenerSetMap.get(event.type)
    listenerSet.forEach((listener) => listener(event))
  }
}

// node 'EventEmitter' style
// emitter.addListener(eventName, listener)
// emitter.removeListener(eventName, listener)
// emitter.removeAllListeners([eventName])
// emitter.emit(eventName[, ...args])
// emitter.on(eventName, listener)

class EventEmitter {
  constructor () {
    this.listenerSetMap = new Map()

    this.on = this.addListener // alias
  }

  addListener (eventName, listener) {
    if (!this.listenerSetMap.has(eventName)) this.listenerSetMap.set(eventName, new Set([ listener ]))
    else this.listenerSetMap.get(eventName).add(listener)
  }

  removeListener (eventName, listener) {
    if (!this.listenerSetMap.has(eventName)) return
    const listenerSet = this.listenerSetMap.get(eventName)
    if (!listenerSet.has(listener)) return
    listenerSet.delete(listener)
    if (listenerSet.size === 0) this.listenerSetMap.delete(eventName)
  }

  removeAllListeners (eventName) {
    if (eventName === undefined) this.listenerSetMap.clear()
    else {
      if (!this.listenerSetMap.has(eventName)) return
      this.listenerSetMap.delete(eventName)
    }
  }

  emit (eventName, ...args) {
    if (!this.listenerSetMap.has(eventName)) return
    const listenerSet = this.listenerSetMap.get(eventName)
    listenerSet.forEach((listener) => listener(...args))
  }
}

export { EventTarget, EventEmitter }
