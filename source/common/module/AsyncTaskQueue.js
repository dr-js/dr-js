import { createInsideOutPromise } from 'source/common/function'

// NOTE: simple size reduction for minify
const GET_SIZE = 'A'
const ADD_SIZE = 'B'
const SUB_SIZE = 'C'
const GET_IS_VALID = 'D'
const SET_INVALID = 'E'

const createQueueStatus = (size = 0, isValid = true) => ({
  [ GET_SIZE ]: () => size,
  [ ADD_SIZE ]: () => ++size,
  [ SUB_SIZE ]: () => --size,
  [ GET_IS_VALID ]: () => isValid,
  [ SET_INVALID ]: () => (isValid = false)
})

const MUTE_ERROR = (error) => { __DEV__ && console.error(error) }

const createAsyncTaskQueue = (onQueueError = MUTE_ERROR) => {
  let queueStatus = createQueueStatus()
  let queueTail = Promise.resolve('QUEUE_HEAD')

  const reset = () => { // break previous queue, reset state (not that safe, may still leak promise/memory)
    queueStatus[ SET_INVALID ]()
    queueStatus = createQueueStatus()
    queueTail = Promise.resolve('QUEUE_HEAD')
  }

  const getLength = () => queueStatus[ GET_SIZE ]()

  const pushTask = (asyncTask) => { // task is async function
    const { promise, resolve } = createInsideOutPromise()
    const taskPromise = queueTail.then(asyncTask)
    taskPromise
      .catch(onQueueError) // should not re-throw error for the queue to keep running
      .then(() => {
        queueStatus[ SUB_SIZE ]()
        queueStatus[ GET_IS_VALID ]() && resolve()
      }) // the promise chain is not chained up directly
    queueStatus[ ADD_SIZE ]()
    queueTail = promise
    return taskPromise
  }

  return { reset, getLength, pushTask }
}

export { createAsyncTaskQueue }
