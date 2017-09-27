import { createInsideOutPromise } from 'source/common/function'

const createAsyncTaskQueue = (onQueueError = () => {}) => {
  let taskSet = new Set()
  let taskQueueTail = Promise.resolve('QUEUE_HEAD')

  const pushTask = (task) => { // task is async function
    const { promise, resolve, reject } = createInsideOutPromise()
    taskQueueTail = taskQueueTail.then(() => Promise.resolve(task())
      .then(resolve, reject)
      .catch(onQueueError) // mute error
      .then(() => taskSet.delete(task))
    )
    taskSet.add(task)
    return promise
  }

  const resetTaskQueue = () => {
    taskSet = new Set()
    taskQueueTail = Promise.resolve('QUEUE_HEAD')
  }

  const getTaskQueueSize = () => taskSet.size

  return { pushTask, resetTaskQueue, getTaskQueueSize }
}

export { createAsyncTaskQueue }
