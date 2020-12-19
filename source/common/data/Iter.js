import { createInsideOutPromise } from 'source/common/function'

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
  return {
    ...wrapAsync(async () => { // NOTE: expect to call this before send/throw to `await nextIOP.promise`
      if (nextLock) throw new Error('double-next')
      nextLock = true
      sendIOP.resolve()
      const result = await nextIOP.promise
      nextIOP = createInsideOutPromise()
      nextLock = false
      return result // { value, done }
    }),
    send: async (value, done = false) => {
      if (sendLock) throw new Error('double-send')
      sendLock = true
      await sendIOP.promise
      nextIOP.resolve({ value, done })
      sendIOP = createInsideOutPromise()
      sendLock = false
    },
    throw: async (error) => { nextIOP.reject(error) }
  }
}

export {
  unwrap,
  wrapSync, wrapAsync,
  createLockStepAsyncIter
}
