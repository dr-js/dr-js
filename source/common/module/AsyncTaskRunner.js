import { getTimestamp } from 'source/common/time'
import { createAsyncTaskQueue } from './AsyncTaskQueue'

// NOTE: usage:
// - for running async task with taskStatus remaining for later query
// - endTask / autoEndTask should be called manually to clear the taskState, or cleared by timer

const createAsyncTaskRunner = ({
  clearRunner = () => {}, // clear / reset all, will pass returned promise to outer code
  resetRunner = (error, taskId) => { __DEV__ && console.warn('[resetRunner]', taskId, error) }, // clean up for single task, will pass returned promise to outer code, should not re throw error
  getTaskId,
  getTaskInitialState = (taskState) => taskState,
  runTask
}) => {
  const { reset: resetQueue, getLength: getQueueLength, pushTask } = createAsyncTaskQueue()
  const taskStateMap = new Map()

  const createTaskAndPushToTaskQueue = (taskId, option) => {
    const promise = pushTask(() => runTask(taskId, { getTaskState, updateTaskState }))
      .then((result) => updateTaskState(taskId, { result, promise: null, endAt: getTimestamp() }))
      .catch((error) => {
        updateTaskState(taskId, { error, promise: null, endAt: getTimestamp() })
        return resetRunner(error, taskId)
      })
    const taskState = getTaskInitialState({
      id: taskId,
      option,
      promise, // if promise is cleared, task is considered ended (failed|completed)
      error: null, // if error is set, task is considered failed (ended)
      result: null, // optional, set when ended
      startAt: getTimestamp(), // in second
      endAt: null // in second, if endAt is set, task is considered ended (failed|completed)
    })
    taskStateMap.set(taskId, taskState)
    return taskState
  }

  const getTaskState = (taskId) => taskStateMap.get(taskId)
  const updateTaskState = (taskId, nextState) => {
    const state = getTaskState(taskId)
    state && taskStateMap.set(taskId, { ...state, ...nextState })
  }
  const endTask = (taskId) => taskStateMap.delete(taskId)

  return {
    clear: () => { // drop all data
      resetQueue()
      taskStateMap.clear()
      return clearRunner()
    },
    getStatus: (isVerbose) => ({
      taskQueue: getQueueLength(),
      taskStateMap: taskStateMap.size,
      taskStateList: isVerbose ? Array.from(taskStateMap.entries()) : undefined
    }),
    getQueueLength,
    getTaskState,
    startTask: (option) => {
      const taskId = getTaskId(option)
      return taskStateMap.get(taskId) || createTaskAndPushToTaskQueue(taskId, option) // return taskState
    },
    endTask,
    autoEndTask: (minEndedTime) => { // in second (for timestamp)
      const maxEndTime = getTimestamp() - Math.abs(minEndedTime)
      taskStateMap.forEach((task, taskId) => { task.endAt && task.endAt <= maxEndTime && endTask(taskId) })
    }
  }
}

const createAsyncTaskRunnerCluster = ({
  runnerList = [],
  getRunnerByTaskId, // (runnerList, taskId) => runner
  selectRunner = selectMinLoadRunner // can return false to drop task, but better not
}) => ({
  clear: () => runnerList.map((taskRunner) => taskRunner.clear()),
  getStatus: (isVerbose) => runnerList.map((taskRunner) => taskRunner.getStatus(isVerbose)),
  getQueueLength: () => runnerList.map((taskRunner) => taskRunner.getQueueLength()), // NOTE: this is a list of length
  getTaskState: (taskId) => {
    const taskRunner = getRunnerByTaskId(runnerList, taskId)
    return taskRunner && taskRunner.getTaskState(taskId)
  },
  startTask: (option) => selectRunner(runnerList, option).startTask(option),
  endTask: (taskId) => {
    const taskRunner = getRunnerByTaskId(runnerList, taskId)
    return taskRunner && taskRunner.endTask(taskId)
  },
  autoEndTask: (minEndedTime) => runnerList.forEach((taskRunner) => taskRunner.autoEndTask(minEndedTime))
})

const selectMinLoadRunner = (runnerList) => runnerList.reduce(
  (o, taskRunner) => o.getQueueLength() > taskRunner.getQueueLength() ? taskRunner : o,
  runnerList[ 0 ]
)

export {
  createAsyncTaskRunner,
  createAsyncTaskRunnerCluster,
  selectMinLoadRunner
}
