import { getTimestamp } from 'source/common/time'
import { createAsyncTaskQueue } from './AsyncTaskQueue'

// NOTE: usage:
// - for running async task with taskStatus remaining for later query
// - endTask / autoEndTask should be called manually to clear the taskState, or cleared by timer

const createTaskRunner = ({
  clearRunner = () => {}, // clear / reset all, can return promise
  resetRunner = (error, taskId) => { __DEV__ && console.warn('[resetRunner]', taskId, error) }, // clean up for one task, can return promise, but return error is bad since it's in taskState already
  getTaskId,
  getTaskInitialState = (taskState) => taskState,
  runTask
}) => {
  const { resetTaskQueue, getTaskQueueSize, pushTask } = createAsyncTaskQueue()
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
      resetTaskQueue()
      taskStateMap.clear()
      return clearRunner()
    },
    getStatus: (isVerbose) => ({
      taskQueueSize: getTaskQueueSize(),
      taskStateMapSize: taskStateMap.size,
      taskStateList: isVerbose ? Array.from(taskStateMap.entries()) : undefined
    }),
    getTaskQueueSize,
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

const createTaskRunnerCluster = ({
  taskRunnerList = [],
  getClusterIndexFromTaskId, // (taskId) => clusterIndex
  selectTaskRunner = selectMinLoadTaskRunner // can return false to drop task, but better not
}) => ({
  clear: () => taskRunnerList.map((taskRunner) => taskRunner.clear()),
  getStatus: (isVerbose) => taskRunnerList.map((taskRunner) => taskRunner.getStatus(isVerbose)),
  getTaskQueueSize: () => taskRunnerList.map((taskRunner) => taskRunner.getTaskQueueSize()),
  getTaskState: (taskId) => {
    const taskRunner = taskRunnerList[ Number(getClusterIndexFromTaskId(taskId)) ]
    return taskRunner && taskRunner.getTaskState(taskId)
  },
  startTask: (option) => {
    const taskRunner = selectTaskRunner(taskRunnerList, option)
    return taskRunner && taskRunner.startTask(option)
  },
  endTask: (taskId) => {
    const taskRunner = taskRunnerList[ Number(getClusterIndexFromTaskId(taskId)) ]
    return taskRunner && taskRunner.endTask(taskId)
  },
  autoEndTask: (minEndedTime) => taskRunnerList.forEach((taskRunner) => taskRunner.autoEndTask(minEndedTime))
})

const selectMinLoadTaskRunner = (taskRunnerList) => taskRunnerList.reduce(
  (o, taskRunner) => o.getTaskQueueSize() > taskRunner.getTaskQueueSize() ? taskRunner : o,
  taskRunnerList[ 0 ]
)

export {
  createTaskRunner,
  createTaskRunnerCluster,
  selectMinLoadTaskRunner
}
