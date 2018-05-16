import { createInsideOutPromise } from 'source/common/function'

const MUTE_ERROR = (error) => { __DEV__ && console.error(error) }

const createQueueStatus = (size = 0, isValid = true) => ({
  getSize: () => size,
  increaseSize: () => ++size,
  decreaseSize: () => --size,
  getIsValid: () => isValid,
  invalid: () => (isValid = false)
})

const createAsyncTaskQueue = (onQueueError = MUTE_ERROR) => {
  let queueStatus, queueTail

  const resetTaskQueue = () => {
    queueStatus && queueStatus.invalid()
    queueStatus = createQueueStatus()
    queueTail = Promise.resolve('QUEUE_HEAD')
  }
  const getTaskQueueSize = () => queueStatus.getSize()
  const pushTask = (asyncTask) => { // task is async function
    const { promise, resolve } = createInsideOutPromise()
    const taskPromise = queueTail.then(asyncTask)
    taskPromise
      .catch(onQueueError) // should not re-throw error for the queue to keep running
      .then(() => {
        queueStatus.decreaseSize()
        queueStatus.getIsValid() && resolve()
      }) // the promise chain is not chained up directly
    queueStatus.increaseSize()
    queueTail = promise
    return taskPromise
  }

  resetTaskQueue()

  return { resetTaskQueue, getTaskQueueSize, pushTask }
}

export { createAsyncTaskQueue }
