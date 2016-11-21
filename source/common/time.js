import { global } from 'source/env'

function getClock () {
  const { performance, process } = global
  if (performance) {
    try {
      const clock = performance.now // milliseconds
      const time = clock()
      if (time <= clock()) return clock
    } catch (error) { }
    try {
      const clock = performance.now.bind(performance)
      const time = clock()
      if (time <= clock()) return clock
    } catch (error) { }
  }
  if (process) {
    try {
      const clock = () => {
        const [ seconds, nanoseconds ] = process.hrtime()
        return seconds * 1000000 + nanoseconds * 0.000001
      }
      const time = clock()
      if (time <= clock()) return clock
    } catch (error) { }
    return
  }
  try {
    const clock = global.performance.now
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { }
  return Date.now
}

const clock = getClock() // return running time in milliseconds
const CLOCK_PER_SECOND = 1000
const CLOCK_TO_SECOND = 1 / CLOCK_PER_SECOND
const TIMESTAMP_START = Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC
const now = () => (Date.now() * CLOCK_TO_SECOND - TIMESTAMP_START) // return running time in seconds
const getTimeStamp = () => Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC

// Usage:
// Promise.resolve('DATA')
//   .then(setTimeoutPromise(500))
//   .then((result) => {}) // result === 'DATA'
// NOTE: not cancellable
const setTimeoutPromise = (wait = 1000) => (result) => new Promise((resolve) => setTimeout(() => resolve(result), wait))

const onNextProperUpdate = global.requestAnimationFrame ||
  ((callback) => setTimeout(callback, 1000 / 60))

export {
  CLOCK_PER_SECOND,
  CLOCK_TO_SECOND,
  TIMESTAMP_START,

  clock,
  now,
  getTimeStamp,

  setTimeoutPromise,

  onNextProperUpdate
}