export const GLOBAL = (typeof (window) !== 'undefined' ? window : (typeof (global) !== 'undefined' ? global : this)) // normally window, global or this for a sandbox?
export const ENVIRONMENT = (() => {
  const isBrowser = (typeof (GLOBAL.window) !== 'undefined' && typeof (GLOBAL.document) !== 'undefined')
  const isNode = (typeof (GLOBAL.process) !== 'undefined' && typeof (GLOBAL.process.versions) !== 'undefined' && GLOBAL.process.versions.node)
  const isCordova = (typeof (GLOBAL.cordova) !== 'undefined')
  return isCordova ? 'cordova'
    : isNode ? 'node'
    : isBrowser ? 'browser'
    : 'unknown'
})()
export const SYSTEM_ENDIANNESS = (() => {
  try {
    const buffer = new ArrayBuffer(4)
    const viewUint8 = new Uint8Array(buffer)
    const viewUint32 = new Uint32Array(buffer)
    viewUint8[ 0 ] = 0xa1
    viewUint8[ 1 ] = 0xb2
    viewUint8[ 2 ] = 0xc3
    viewUint8[ 3 ] = 0xd4
    if (viewUint32[ 0 ] === 0xd4c3b2a1) return 'little'
    if (viewUint32[ 0 ] === 0xa1b2c3d4) return 'big'
  } catch (error) {
    // mute error
  }
  return 'unknown'
})()

// ENVIRONMENT dependent
const { loadScript, nodeExePath, nodeStartScriptPath, getLocalPath, startREPL } = (() => {
  switch (ENVIRONMENT) {
    case 'browser':
    case 'cordova':
      return {
        loadScript: (src) => new Promise((resolve) => {
          const element = document.createElement('script')
          element.type = 'text/javascript'
          element.async = false
          element.src = src
          element.onload = () => resolve(element)
          const existElement = document.getElementsByTagName('script')[ 0 ]
          existElement.parentNode.insertBefore(element, existElement)
        })
      }
    case 'node':
      const nodeModuleFs = require('fs')
      const nodeModuleVm = require('vm')
      const nodeModulePath = require('path')
      const nodeModuleRepl = require('repl')
      return {
        nodeExePath: GLOBAL.process.argv[ 0 ],
        nodeStartScriptPath: nodeModulePath.resolve(GLOBAL.process.cwd(), nodeModulePath.dirname(GLOBAL.process.argv[ 1 ])),
        getLocalPath: (relativePath) => nodeModulePath.resolve(nodeStartScriptPath, relativePath),
        startREPL: () => nodeModuleRepl.start({
          prompt: 'Dr> ',
          input: GLOBAL.process.stdin,
          output: GLOBAL.process.stdout,
          useGlobal: true
        }),

        loadScript: (src) => new Promise((resolve, reject) => {
          if (src.search('://') !== -1) return console.log([ '[loadScript] not support web content yet...', src ])
          const localPath = getLocalPath(src)
          try {
            nodeModuleFs.readFile(localPath, function (error, data) {
              if (error) throw error
              if (!data) throw new Error('failed to read file data:' + data)
              nodeModuleVm.runInThisContext(data.toString(), { filename: localPath })
              resolve(data)
            })
          } catch (error) {
            reject(error)
          }
        })
      }
  }
})()
export { loadScript, nodeExePath, nodeStartScriptPath, getLocalPath, startREPL }

export function loadScriptByList (srcList) {
  const loopLoad = () => new Promise((resolve) => (srcList.length <= 0) ? resolve() : loadScript(srcList.shift()).then(loopLoad))
  return loopLoad() // start loop
}

export const onNextProperUpdate = GLOBAL.requestAnimationFrame
  ? GLOBAL.requestAnimationFrame
  : (callback) => setTimeout(callback, 1000 / 60)

function getConsoleMethod (name) {
  const argumentList = console[ name ].apply
    ? (argList) => console[ name ].apply(console, argList)
    : (argList) => console[ name ](argList)
  const direct = console[ name ].bind
    ? console[ name ].bind(console)
    : (...args) => argumentList(args)
  return [ argumentList, direct ]
}
const [logList, log] = getConsoleMethod('log')
const [warnList, warn] = getConsoleMethod('warn')
const [errorList, error] = getConsoleMethod('error')
export { logList, log, warnList, warn, errorList, error }

function throwAssertError (argList) {
  argList.unshift('[ASSERT]')
  errorList(argList)
  throw new Error(argList.join(', ')) // guaranteed Error throw (console.assert in Browser do not throw)
}
export const assertList = (argList) => {
  argList.shift() || throwAssertError(argList)
}
export const assert = (assertion, ...args) => {
  assertion || throwAssertError(args)
}
export const getArgumentArray = (args, omitCount = 0) => Array.prototype.slice.call(args, omitCount)

// math related

// this will not auto swap, meaning <from> should be smaller than <to>
const __getRandomInt = (from, to) => Math.floor(Math.random() * (to - from + 1) + from) // range [from, to]
export function getRandomInt (a, b = 0) {
  return __getRandomInt(Math.min(a, b), Math.max(a, b))
}
export function getRandomIntMulti (a, b, count) { // the result will be from small to big
  const from = Math.min(a, b)
  const to = Math.max(a, b)
  const resultList = []
  for (let i = 0, iMax = Math.min(count, (to - from + 1)); i < iMax; i++) {
    let next = __getRandomInt(from, to - i)
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
  const resultMap = {}
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
export function logError (error, ...args) {
  warn('Error', error.stack || error)
  warnList(args)
}

export function getFilledArray (length, value) {
  return new Array(Number(length)).fill(value)
}

const symbolList = '0123456789ACEFGHJKLMNPQRSTUVWXYZ'.split('') // lite 32 // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') //full 62
const symbolCount = symbolList.length
const resultCount = 20
const indexList = getFilledArray(resultCount, 0)
const resultList = getFilledArray(resultCount, symbolList[ 0 ])
export function generateId () { // easy to recognise, but only safe within one runtime
  for (let i = resultCount - 1; i >= 0; i--) {
    indexList[ i ] = (indexList[ i ] + 1) % symbolCount
    resultList[ i ] = symbolList[ indexList[ i ] ]
    if (indexList[ i ] > 0) break
  }
  return resultList.join('') // get string
}

// time related
export const clockPerSecond = 1000
export const clockToSecond = 1 / clockPerSecond
export const startClock = Date.now() // UTC
export const startTimestamp = Math.floor(startClock * clockToSecond) // UTC
export function clock () {
  return (Date.now() - startClock) // return running time in milliseconds
}
export function now () {
  return (Date.now() - startClock) * clockToSecond // return running time in seconds
}
export function getTimeStamp () { // UTC
  return Math.floor(Date.now() * clockToSecond)
}

export function delay (callback, time, isRepeat) {
  const setFunc = isRepeat ? setInterval : setTimeout
  const clearFunc = isRepeat ? clearInterval : clearTimeout
  const clearId = setFunc(callback, time * 1000)
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
