import { createInsideOutPromise } from 'source/common/function'
import { getRandomId } from 'source/common/math/random'

const unwrap = ({
  iterable, // { [ Symbol.asyncIterator ] } or { [ Symbol.iterator ] }
  iterator = iterable && (iterable[ Symbol.asyncIterator ] || iterable[ Symbol.iterator ]).call(iterable), // { next: async () => ({ value, done }) }
  next = iterator && iterator.next.bind(iterator) // async or sync
}) => next

const wrapSync = (next) => ({
  next, // as sync iterator
  [ Symbol.iterator ]: () => ({ next }) // as sync iterable
})

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
  const id = __DEV__ && getRandomId()
  __DEV__ && console.log(`[LSAI|${id}] create`)
  return {
    ...wrapAsync(async () => { // NOTE: expect to call this before send/throw to `await nextIOP.promise`
      if (nextLock) throw new Error('double-next')
      __DEV__ && console.log(`[LSAI|${id}|next] pre`)
      nextLock = true
      sendIOP.resolve()
      const result = await nextIOP.promise
      __DEV__ && console.log(`[LSAI|${id}|next] post`, result)
      if (isDone === false) nextIOP = createInsideOutPromise()
      nextLock = false
      return result // { value, done }
    }),
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
    abort: (value) => { // will bypass pending send, for normal done, use `.send(undefined, true)`
      isDone = true
      nextIOP.resolve({ value, done: true })
    },
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
