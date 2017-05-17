import { global } from 'source/env'

const CLOCK_PER_SECOND = 1000
const CLOCK_TO_SECOND = 1 / CLOCK_PER_SECOND

const CLOCK_START = Date.now() // UTC
const TIMESTAMP_START = Math.floor(CLOCK_START * CLOCK_TO_SECOND) // UTC

const clock = () => (Date.now() - CLOCK_START) // return running time in milliseconds
const now = () => ((Date.now() - CLOCK_START) * CLOCK_TO_SECOND) // return running time in seconds
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
  CLOCK_START,
  TIMESTAMP_START,

  clock,
  now,
  getTimeStamp,

  setTimeoutPromise,

  onNextProperUpdate
}