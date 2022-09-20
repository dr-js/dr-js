import { createInsideOutPromise } from 'source/common/function.js'
import { getRandomId62S } from 'source/common/math/random.js'

/** @typedef { { value: *, done: boolean } } IterStatus */
/** @typedef { () => IterStatus } IterNextSync */
/** @typedef { () => Promise<IterStatus> } IterNextAsync */
/** @typedef { () => { next: IterNextSync } } IterIteratorSync */
/** @typedef { () => { next: IterNextAsync } } IterIteratorAsync */
/** @typedef { { next: IterNextSync, [ Symbol.iterator ]: IterIteratorSync } } IterIterableSync */
/** @typedef { { next: IterNextAsync, [ Symbol.asyncIterator ]: IterIteratorAsync } } IterIterableAsync */

/** @type { (option: {
 *    iterable?: IterIterableSync | IterIterableAsync,
 *    iterator?: IterIteratorSync | IterIteratorAsync,
 *    next?: IterNextSync | IterNextAsync,
 * }) => IterNextSync | IterNextAsync }  */
const unwrap = ({
  iterable, // { [ Symbol.asyncIterator ] } or { [ Symbol.iterator ] }
  iterator = iterable && (iterable[ Symbol.asyncIterator ] || iterable[ Symbol.iterator ]).call(iterable), // { next: async () => ({ value, done }) }
  next = iterator && iterator.next.bind(iterator) // async or sync
}) => next

/** @type { (n: IterNextSync) => IterIterableSync }  */
const wrapSync = (next) => ({
  next, // as sync iterator
  [ Symbol.iterator ]: () => ({ next }) // as sync iterable
})

/** @type { (n: IterNextAsync) => IterIterableAsync }  */
const wrapAsync = (next) => ({
  next, // as async iterator
  [ Symbol.asyncIterator ]: () => ({ next }) // as async iterable
})

const createLockStepAsyncIter = () => {
  let sendIOP = createInsideOutPromise()
  let nextIOP = createInsideOutPromise()
  let sendLock = false
  let nextLock = false
  let isDone = false
  const id = __DEV__ && getRandomId62S()
  __DEV__ && console.log(`[LSAI|${id}] create`)
  return {
    ...wrapAsync(async () => { // NOTE: expect to call this before send/throw to `await nextIOP.promise`
      if (nextLock) throw new Error('double-next')
      __DEV__ && console.log(`[LSAI|${id}|next] pre`)
      nextLock = true
      sendIOP.resolve()
      /** @type { IterStatus }  */
      const result = await nextIOP.promise
      __DEV__ && console.log(`[LSAI|${id}|next] post`, result)
      if (isDone === false) nextIOP = createInsideOutPromise()
      nextLock = false
      return result // { value, done }
    }),
    /** @type { (value: *, done: boolean) => Promise<void> } */
    send: async (value, done = false) => { // send after done will be no-op
      if (sendLock) throw new Error('double-send')
      __DEV__ && console.log(`[LSAI|${id}|send] pre`, done)
      sendLock = true
      await sendIOP.promise
      isDone = done
      nextIOP.resolve({ value, done }) // TODO: need to allow next resolve after done
      __DEV__ && console.log(`[LSAI|${id}|send] post`)
      if (isDone === false) sendIOP = createInsideOutPromise()
      sendLock = false
    },
    /** @type { (value: *) => void } */
    abort: (value) => { // will bypass pending send, for normal done, use `.send(undefined, true)`
      isDone = true
      nextIOP.resolve({ value, done: true })
    },
    /** @type { (error: Error) => void } */
    throw: (error) => {
      isDone = true
      nextIOP.reject(error)
    }
  }
}

export {
  unwrap,
  wrapSync, wrapAsync,
  createLockStepAsyncIter
}
