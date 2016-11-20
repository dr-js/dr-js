export default class Event {
  constructor () {
    this.eventMap = new Map()
  }

  emit (key) {
    const callbackList = this.getListenerList(key)
    if (callbackList) for (const i in callbackList) callbackList[ i ].apply(null, arguments)
  }

  addEventListener (key, callback) {
    if (!callback || typeof (callback) !== 'function') throw new Error('invalid callback')
    const callbackList = this.getListenerList(key)
    for (const i in callbackList) if (callbackList[ i ] === callback) throw new Error('callback already exist')
    callbackList.push(callback)
    return key
  }

  removeEventListener (key, callback) {
    const callbackList = this.getListenerList(key)
    for (const i in callbackList) {
      if (callbackList[ i ] === callback) {
        callbackList.splice(i, 1)
        return callback
      }
    }
    return null
  }

  removeEventKey (key) {
    this.eventMap.delete(key)
  }

  removeAll () {
    this.eventMap.clear()
  }

  getListenerList (key) {
    if (!this.eventMap.has(key)) this.eventMap.set(key, [])
    return this.eventMap.get(key)
  }
}
