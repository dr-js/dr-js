const tryClock = () => {
  try { // browser
    const { performance } = globalThis
    const clock = () => performance.now()
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { __DEV__ && console.log('[tryClock] browser', error) }

  try { // node
    const { process } = globalThis
    const clock = () => {
      const [ seconds, nanoseconds ] = process.hrtime()
      return seconds * 1000 + nanoseconds * 0.000001
    }
    const time = clock()
    if (time <= clock()) return clock
  } catch (error) { __DEV__ && console.log('[tryClock] node', error) }

  return Date.now // last fallback
}

const tryWeakTimer = () => {
  try { // node
    const toWeakTimer = (func) => (...args) => {
      const token = func(...args)
      token.unref()
      return token
    }
    const token = setTimeout(() => {}, 0)
    clearTimeout(token)
    if (typeof token.unref === 'function') return [ setTimeout, setInterval ].map(toWeakTimer)
  } catch (error) { __DEV__ && console.log('[tryWeakTimer] node', error) }

  return [ setTimeout, setInterval ] // fallback
}

const CLOCK_PER_SECOND = 1000
const CLOCK_TO_SECOND = 1 / CLOCK_PER_SECOND

const clock = tryClock() // return running/relative time in milliseconds
const getTimestamp = () => Math.floor(Date.now() * CLOCK_TO_SECOND) // UTC, integer, in seconds; use `Date.now()` directly for milliseconds value

// similar to output of `TZ=UTC0 date +%Y%m%d`, in `YYYYMMDD` format
const getUTCDateTag = (date = new Date()) => [ date.getUTCFullYear(), pad00(date.getUTCMonth() + 1), pad00(date.getUTCDate()) ].join('')
const pad00 = (number) => String(number).padStart(2, '0')

const [ setWeakTimeout, setWeakInterval ] = tryWeakTimer() // NOTE: using this only make sense in common/node

// NOTE: no way to cancel the timeout, may keep node running longer than expected
// Usage:
// const getData = async () => {
//   await setTimeoutAsync(500)
//   return 'DATA'
// }
const setTimeoutAsync = (wait = 0) => new Promise((resolve) => setTimeout(resolve, wait))
const setWeakTimeoutAsync = (wait = 0) => new Promise((resolve) => setWeakTimeout(resolve, wait))

const setAwaitAsync = async (awaitCount = 0) => { // better use it as a relative delay method, passing 0 will still cause a baseline await/then
  while (awaitCount > 0) {
    await null
    awaitCount--
  }
}

const tryFrameUpdate = () => {
  try { // browser
    const { requestAnimationFrame, cancelAnimationFrame } = globalThis
    const token = requestAnimationFrame(() => {})
    cancelAnimationFrame(token)
    return [ requestAnimationFrame, cancelAnimationFrame ]
  } catch (error) { __DEV__ && console.log('[tryFrameUpdate] browser', error) }

  return [ (func) => setTimeout(func, 1000 / 60), clearTimeout ] // fallback
}

const [ requestFrameUpdate, cancelFrameUpdate ] = tryFrameUpdate()

const createTimer = ({
  func,
  delay,
  queueTask = setTimeout,
  cancelTask = clearTimeout
}) => {
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
  const getDelay = () => delay
  const setDelay = (nextDelay) => {
    if (nextDelay === delay) return // skip same delay
    delay = nextDelay
    stop()
    start()
  }
  return { start, stop, isActive, getDelay, setDelay }
}

const createStepper = (prevTime = clock()) => () => {
  const nextTime = clock()
  const result = nextTime - prevTime
  prevTime = nextTime
  return result
}

export {
  CLOCK_PER_SECOND,
  CLOCK_TO_SECOND,
  clock,
  getTimestamp, getUTCDateTag,
  setWeakTimeout, setWeakInterval,
  setTimeoutAsync, setWeakTimeoutAsync, setAwaitAsync,
  requestFrameUpdate,
  cancelFrameUpdate,
  createTimer,
  createStepper
}
