import { global } from 'source/env'

const tryClock = () => {
  try { // browser
    const { performance } = global
    const clock = performance.now.bind(performance)
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { __DEV__ && console.log(`[tryClock] browser`, error) }

  try { // node
    const { process } = global
    const clock = () => {
      const [ seconds, nanoseconds ] = process.hrtime()
      return seconds * 1000 + nanoseconds * 0.000001
    }
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { __DEV__ && console.log(`[tryClock] node`, error) }

  return Date.now // last fallback
}

const CLOCK_PER_SECOND = 1000
const CLOCK_TO_SECOND = 1 / CLOCK_PER_SECOND
const TIMESTAMP_START = Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC

const clock = tryClock() // return running time in milliseconds
const now = () => (Date.now() * CLOCK_TO_SECOND - TIMESTAMP_START) // TODO: needed? return running time in seconds
const getTimestamp = () => Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC

// Usage:
// const getData = async () => {
//   await setTimeoutAsync(500)
//   return 'DATA'
// }
const setTimeoutAsync = (wait = 0) => new Promise((resolve) => setTimeout(resolve, wait))

// Usage:
// Promise.resolve('DATA')
//   .then(setTimeoutPromise(500)) // will pass data through
//   .then((result) => {}) // result === 'DATA'
const setTimeoutPromise = (wait = 0) => (data) => new Promise((resolve) => setTimeout(() => resolve(data), wait))

const [ requestFrameUpdate, cancelFrameUpdate ] = global.requestAnimationFrame
  ? [ global.requestAnimationFrame, global.cancelAnimationFrame ]
  : [ (func) => setTimeout(func, 1000 / 60), clearTimeout ]

const createTimer = ({ func, delay, queueTask = setTimeout, cancelTask = clearTimeout }) => {
  let token = null
  const update = () => {
    if (!token) return
    token = queueTask(update, delay)
    func()
  }
  const start = () => { if (!token) token = queueTask(update, delay) }
  const stop = () => {
    if (!token) return
    cancelTask(token)
    token = null
  }
  const isActive = () => Boolean(token)
  return { start, stop, isActive }
}

export {
  CLOCK_PER_SECOND,
  CLOCK_TO_SECOND,
  TIMESTAMP_START,
  clock,
  now,
  getTimestamp,
  setTimeoutAsync,
  setTimeoutPromise,
  requestFrameUpdate,
  cancelFrameUpdate,
  createTimer
}
