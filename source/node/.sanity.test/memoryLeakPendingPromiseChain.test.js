import { createTestFunc, commonFunc } from './function.test'

const { describe, it } = global

// for win32 it's `code: 134, signal: null`
// for linux it's `code: null, signal: SIGABRT`
const EXIT_CODE_NODE_OOM = process.platform === 'win32' ? 134 : null

process.env.TEST_SANITY && describe('Node.SanityTest.MemoryLeakPendingPromiseChain (slow)', () => {
  it('[OOM] tail-recursive promise setup 00', createTestFunc(EXIT_CODE_NODE_OOM, async () => {
    // GH sample, edit & formatted. https://github.com/promises-aplus/promises-spec/issues/179#issuecomment-93453094
    const run = (i) => new Promise((resolve) => setImmediate(resolve))
      .then(() => {
        if (i % 1e5 === 0) console.log({ i })
        return i < 99999999 ? run(i + 1) : i // NOTE: tail-recursive setup
      })
    await run(0).then((result) => console.log(result))
  }))

  it('[OOM] tail-recursive promise setup 01', createTestFunc(EXIT_CODE_NODE_OOM, async () => {
    // edit & formatted. https://alexn.org/blog/2017/10/11/javascript-promise-leaks-memory.html
    const signal = (i) => new Promise((resolve) => setImmediate(() => resolve(i)))
    const loop = (n) => signal(n).then(i => {
      if (i % 1e5 === 0) console.log({ i })
      return loop(n + 1) // NOTE: tail-recursive setup
    })
    await loop(0).catch(console.error)
  }))

  it('[SAFE] no-recursive promise setup', createTestFunc(0, commonFunc, async (triggerGC, { markMemory }) => {
    let i = 0
    let promiseTail = Promise.resolve()
    const token = setInterval(() => { // simulate user input or other outer timer adding batch of task to the queue
      if (i >= 1e7) return clearInterval(token) // check finish
      let n = 0
      while (n++ !== 1e5) {
        promiseTail = promiseTail.then(() => { // NOTE: drop previous promise, only keep last one
          i = i + 1
          if (i % 1e6 !== 0) return // check log
          console.log({ i })
          markMemory()
        })
      }
    }, 0)
  }))

  it('[OOM] holding the head & tail promise of a chain of pending promise', createTestFunc(EXIT_CODE_NODE_OOM, commonFunc, async (triggerGC, { setTimeoutAsync, markMemory, appendPromiseAdder }) => {
    const promiseHead = new Promise((resolve) => {}) // NOTE: never resolve, but no reference
    let promiseTail = promiseHead
    let loop = 0
    while (loop++ !== 128) {
      await markMemory()
      promiseTail = appendPromiseAdder(promiseTail, 64 * 1024)
      await setTimeoutAsync(10)
    }
    console.log({ promiseHead, promiseTail })
  }))

  it('[OOM] holding the head-resolve & tail promise of a chain of pending promise', createTestFunc(EXIT_CODE_NODE_OOM, commonFunc, async (triggerGC, { setTimeoutAsync, markMemory, appendPromiseAdder }) => {
    let pendingResolve
    let promiseTail = new Promise((resolve) => { pendingResolve = resolve }) // NOTE: never resolve, but has reference, so later code can resolve
    let loop = 0
    while (loop++ !== 128) {
      await markMemory()
      promiseTail = appendPromiseAdder(promiseTail, 64 * 1024)
      await setTimeoutAsync(10)
    }
    console.log({ pendingResolve, promiseTail })
  }))

  it('[SAFE] holding the tail promise of a chain of pending promise', createTestFunc(0, commonFunc, async (triggerGC, { setTimeoutAsync, markMemory, appendPromiseAdder }) => {
    let promiseTail = new Promise((resolve) => {}) // NOTE: never resolve, but no reference
    let loop = 0
    while (loop++ !== 128) {
      await markMemory()
      promiseTail = appendPromiseAdder(promiseTail, 64 * 1024)
      await setTimeoutAsync(10)
    }
    console.log({ promiseTail })
  }))

  it('[SAFE] holding the head & tail promise of a chain of resolving promise', createTestFunc(0, commonFunc, async (triggerGC, { setTimeoutAsync, markMemory, appendPromiseAdder }) => {
    const promiseHead = new Promise((resolve) => { resolve(0) })
    let promiseTail = promiseHead
    let loop = 0
    while (loop++ !== 128) {
      await markMemory()
      promiseTail = appendPromiseAdder(promiseTail, 64 * 1024)
      await setTimeoutAsync(10)
    }
    console.log({ promiseHead, promiseTail })
  }))

  it('[SAFE] holding the tail promise of a chain of resolving promise', createTestFunc(0, commonFunc, async (triggerGC, { setTimeoutAsync, markMemory, appendPromiseAdder }) => {
    let promiseTail = new Promise((resolve) => { resolve(0) })
    let loop = 0
    while (loop++ !== 128) {
      await markMemory()
      promiseTail = appendPromiseAdder(promiseTail, 64 * 1024)
      await setTimeoutAsync(10)
    }
    console.log({ promiseTail })
  }))
})
