import { createInsideOutPromise } from 'source/common/function'

const MUTE_ERROR = (error) => { __DEV__ && console.error(error) }

const createQueueStatus = (size = 0, isValid = true) => ({
  getSize: () => size,
  addSize: () => ++size,
  subSize: () => --size,
  getIsValid: () => isValid,
  invalid: () => (isValid = false)
})

const createAsyncTaskQueue = (onQueueError = MUTE_ERROR) => {
  let queueStatus = createQueueStatus()
  let queueTail = Promise.resolve('QUEUE_HEAD')

  const resetTaskQueue = () => {
    queueStatus.invalid()
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
        queueStatus.subSize()
        queueStatus.getIsValid() && resolve()
      }) // the promise chain is not chained up directly
    queueStatus.addSize()
    queueTail = promise
    return taskPromise
  }

  return { resetTaskQueue, getTaskQueueSize, pushTask }
}

export { createAsyncTaskQueue }
