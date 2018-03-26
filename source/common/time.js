import { global } from 'source/env'

const getClock = () => {
  try {
    const clock = global.performance.now // msec
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { }
  try {
    const clock = global.performance.now.bind(global.performance)
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { }
  try {
    const clock = () => {
      const [ seconds, nanoseconds ] = global.process.hrtime()
      return seconds * 1000 + nanoseconds * 0.000001
    }
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { }
  return Date.now // last fallback
}

const CLOCK_PER_SECOND = 1000
const CLOCK_TO_SECOND = 1 / CLOCK_PER_SECOND
const TIMESTAMP_START = Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC

const clock = getClock() // return running time in milliseconds
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
    func()
    token = queueTask(update, delay)
  }
  const start = () => {
    stop()
    token = queueTask(update, delay)
  }
  const stop = () => {
    token && cancelTask(token)
    token = null
  }
  return { start, stop }
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
