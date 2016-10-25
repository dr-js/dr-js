import { onNextProperUpdate } from '../config'

export const getArgumentArray = (args, omitCount = 0) => Array.prototype.slice.call(args, omitCount)
export const logList = console.log.apply
  ? (argList) => console.log.apply(console, argList)
  : (argList) => console.log(argList)
export const assertList = console.assert.apply
  ? (argList) => console.assert.apply(console, argList)
  : (assertion, ...argList) => { if (!assertion) throw new Error(argList) }

// math related
function __getRandomInt (from, to) { // this will not auto swap, meaning <from> should be smaller than <to>
  return Math.floor(Math.random() * (to - from + 1) + from) // range [from, to]
}

export function getRandomInt (a, b = 0) { return __getRandomInt(Math.min(a, b), Math.max(a, b)) }
export function getRandomIntMulti (a, b, count) { // the result will be from small to big
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const resultList = []
  count = Math.min(count, (to - from + 1))
  for (let i = 0; i < count; i++) {
    var next = __getRandomInt(from, to - i)
    let j = 0
    while (j < resultList.length) {
      if (resultList[ j ] > next) break
      next++
      j++
    }
    resultList.splice(j, 0, next)
  }
  return resultList
}

// data operation
export function pick (pack, key) {
  let pickData
  if (pack instanceof Object) {
    pickData = pack[ key ]
    delete pack[ key ]
  }
  return pickData
}
export function reverseKeyValue (pack, maskValue) {
  var resultMap = {}
  if (maskValue) for (const key in pack) resultMap[ pack[ key ] ] = maskValue
  else for (const key in pack) resultMap[ pack[ key ] ] = key
  return resultMap
}
export function arrayDeduplication (...arrayList) {
  const dedupMap = {}
  for (const i in arrayList) {
    const array = arrayList[ i ]
    for (const j in array) dedupMap[ array[ j ] ] = true
  }
  const result = []
  for (const key in dedupMap) result.push(key)
  return result
}
export const generateId = (() => {
  // const symbolList = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); //full 62
  const symbolList = '0123456789ACEFGHJKLMNPQRSTUVWXYZ'.split('') // lite 32, easy to recognise, but only safe within one runtime
  const symbolCount = symbolList.length
  const resultCount = 20
  const indexList = []
  const resultList = []
  for (let i = 0; i < resultCount; i++) {
    indexList[ i ] = 0
    resultList[ i ] = symbolList[ indexList[ i ] ]
  }
  return function () {
    for (let i = resultCount - 1; i >= 0; i--) {
      indexList[ i ] = (indexList[ i ] + 1) % symbolCount
      resultList[ i ] = symbolList[ indexList[ i ] ]
      if (indexList[ i ] > 0) break
    }
    return resultList.join('') // get string
  }
})()

// time related
export const clockPerSec = 1000
export function getUTCTimeStamp () {
  return Math.floor(Date.now() / clockPerSec)
}
export const startTimestamp = getUTCTimeStamp()
export const startClock = Date.now()
export function clock () {
  return (Date.now() - startClock) // return running time in milliseconds
}
export function now () {
  return (Date.now() - startClock) / clockPerSec // return running time in seconds
}
export function delay (callback, time, isRepeat) {
  var setFunc = isRepeat ? setInterval : setTimeout
  var clearFunc = isRepeat ? clearInterval : clearTimeout
  var clearId = setFunc(callback, time * 1000)
  return () => clearFunc(clearId) // can be called to remove callback
}

// logic
export function loop (count, callback) {
  let looped = 0
  while (count > looped) {
    callback(looped)
    looped++
  }
}

export class Event {
  constructor () {
    this.eventMap = new Map()
  }

  emit (key) {
    const callbackList = this.getListenerList(key)
    if (callbackList) for (const i in callbackList) callbackList[ i ].apply(null, arguments)
  }

  addEventListener (key, callback) {
    if (!callback || typeof (callback) === 'function') throw new Error('invalid callback')
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

export class UpdateLoop {
  constructor () {
    this.lastUpdateTime = now()
    this.isActive = false
    this.clear()
    // bind first
    this.update = this.update().bind(this)
  }

  start () {
    this.isActive = true
    onNextProperUpdate(this.update)
  }

  stop () {
    this.isActive = false
  }

  clear () {
    this.updateFuncList = [] // index non-constant, will be refreshed on every update
    this.updateFuncMap = new Map() // key constant, will be refreshed on every update
  }

  add (updateFunc, key) {
    key ? this.updateFuncMap.set(key, updateFunc) : this.updateFuncList.push(updateFunc)
  }

  update () {
    const currentUpdateTime = now()
    const deltaTime = currentUpdateTime - this.lastUpdateTime
    this.lastUpdateTime = currentUpdateTime

    const nextUpdateFuncList = []
    this.updateFuncList.forEach((index, updateFunc) => updateFunc(deltaTime) && nextUpdateFuncList.push(updateFunc))
    this.updateFuncList = nextUpdateFuncList

    const nextUpdateFuncMap = new Map()
    this.updateFuncMap.forEach((key, updateFunc) => updateFunc(deltaTime) && nextUpdateFuncMap.set(key, updateFunc))
    this.updateFuncMap = nextUpdateFuncMap

    this.isActive && onNextProperUpdate(this.update)
  }
}

export function Toggle () {
  const toggle = (key, value) => {
    if (value === undefined) value = !toggle[ key ]
    toggle[ key ] = value
    return value
  }
  return toggle
}
