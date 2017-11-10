import { getTimeStamp } from 'source/common/time'
import { createAsyncTaskQueue } from './AsyncTaskQueue'

// const TaskRunnerOptionDebug = {
//   clearRunner: () => {},
//   resetRunner: (error, taskId) => error && console.log(`[DebugTaskRunner|${taskId}] error: ${error.stack || error.toString()}`),
//   getTaskInitialState: (task) => task,
//   runTask: async (taskId, { getTaskState, updateTaskState }) => {
//     console.log(`[DebugTaskRunner|${taskId}] start`)
//     console.log(JSON.stringify(getTaskState(taskId).inputData))
//     for (let index = 0, indexMax = getRandomInt(5, 10); index < indexMax; index++) {
//       await setTimeoutAsync(500)
//       console.log(`[DebugTaskRunner|${taskId}] step [${index}/${indexMax}]`)
//       updateTaskState(taskId, { progress: 100 * (index + 1) / indexMax })
//     }
//     console.log(`[DebugTaskRunner|${taskId}] complete`)
//     return { output: 'DebugTaskRunner' }
//   }
// }

const createTaskRunner = ({ clearRunner, resetRunner, getTaskId, getTaskInitialState, runTask }) => {
  const { pushTask, resetTaskQueue, getTaskQueueSize } = createAsyncTaskQueue()
  const taskStateMap = new Map()
  const clear = async () => {
    await clearRunner()
    resetTaskQueue()
  }
  const getStatus = ({ isVerbose }) => ({
    taskQueueSize: getTaskQueueSize(),
    taskStateMapSize: taskStateMap.size,
    taskStateList: isVerbose ? Array.from(taskStateMap.entries()) : undefined
  })
  const getTaskState = (taskId) => taskStateMap.get(taskId)
  const updateTaskState = (taskId, nextState, state = getTaskState(taskId)) => state && taskStateMap.set(taskId, { ...state, ...nextState })
  const startTask = (inputData) => {
    const taskId = getTaskId(inputData)
    if (!taskStateMap.get(taskId)) {
      taskStateMap.set(taskId, getTaskInitialState({
        id: taskId,
        promise: null,
        error: null, // if error is set, task is considered failed
        inputData,
        outputData: null, // if outputData is set, task is considered completed
        startAt: getTimeStamp(), // in second
        endAt: null // if outputData is set, task is considered ended (failed|completed)
      }))
      const promise = pushTask(async () => {
        const outputData = await runTask(taskId, { getTaskState, updateTaskState })
        updateTaskState(taskId, { outputData, promise: null, endAt: getTimeStamp() }) // force complete
      }).catch((error) => {
        updateTaskState(taskId, { error, promise: null, endAt: getTimeStamp() })
        return resetRunner(error, taskId)
      })
      updateTaskState(taskId, { promise })
    }
    return taskStateMap.get(taskId)
  }
  const endTask = (taskId) => taskStateMap.delete(taskId)
  const autoEndTask = (endDeltaTime) => { // in second
    const maxEndTime = getTimeStamp() - Math.abs(endDeltaTime)
    taskStateMap.forEach((task, taskId) => { task.endAt && task.endAt <= maxEndTime && endTask(taskId) })
  }
  return { clear, getStatus, getTaskQueueSize, getTaskState, startTask, endTask, autoEndTask }
}

const createTaskRunnerCluster = async ({ clusterSize, createTaskRunner, getRunnerFromTaskId }) => {
  const taskRunnerList = []
  for (let clusterIndex = 0; clusterIndex < clusterSize; clusterIndex++) taskRunnerList.push(await createTaskRunner(clusterIndex))
  const clear = async () => {
    for (const taskRunner of taskRunnerList) await taskRunner.clear()
    taskRunnerList.length = 0
  }
  const getStatus = (...args) => taskRunnerList.map((taskRunner) => taskRunner.getStatus(...args))
  const getTaskState = (taskId) => {
    const taskRunner = getRunnerFromTaskId(taskRunnerList, taskId)
    return taskRunner && taskRunner.getTaskState(taskId)
  }
  const startTask = (inputData) => {
    const minLoadTaskRunner = taskRunnerList.reduce((o, taskRunner) => o.getTaskQueueSize() > taskRunner.getTaskQueueSize() ? taskRunner : o, taskRunnerList[ 0 ])
    return minLoadTaskRunner && minLoadTaskRunner.startTask(inputData)
  }
  const endTask = (taskId) => {
    const taskRunner = getRunnerFromTaskId(taskRunnerList, taskId)
    return taskRunner && taskRunner.endTask(taskId)
  }
  const autoEndTask = (...args) => taskRunnerList.forEach((taskRunner) => taskRunner.autoEndTask(...args))
  return { clear, getStatus, getTaskState, startTask, endTask, autoEndTask }
}

export { createTaskRunner, createTaskRunnerCluster }
