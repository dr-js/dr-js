import { createAsyncTaskQueue } from './AsyncTaskQueue'

// ## About `infoQueue` lazy info drop ##
//   since the task and info are pushed at the same time
//   so to drop stale info, the info queue is clipped to taskQueue.getLength()
//   and since there will always be new task being added
//   the clipped time is when new task is added

const createAsyncTaskLane = ({
  laneSize,
  selectLane = selectMinLoadLane
}) => {
  laneSize = Number(laneSize)
  if (!(laneSize >= 1)) throw new Error(`[createTaskLane] invalid laneSize: ${laneSize}`)

  const laneList = [ /* { index, infoQueue, taskQueue } */ ]
  for (let index = 0; index < laneSize; index++) {
    laneList.push({ index, infoQueue: [], taskQueue: createAsyncTaskQueue() })
  }

  const reset = () => laneList.forEach(({ taskQueue, infoQueue }) => {
    taskQueue.reset()
    infoQueue.length = 0
  })

  const getStatus = (isVerbose) => laneList.map(({ index, infoQueue, taskQueue }) => ({
    index: isVerbose ? index : undefined,
    infoQueue: isVerbose ? infoQueue : infoQueue.length,
    taskQueue: taskQueue.getLength()
  }))

  const trimInfoQueue = () => laneList // combine with setInterval for more frequent info trim
    .forEach(({ taskQueue, infoQueue }) => { infoQueue.length = taskQueue.getLength() })

  const pushTask = (asyncTask, info) => { // info should be JSON compatible
    const { index, taskQueue, infoQueue } = selectLane(laneList, info)
    __DEV__ && console.log('[pushTask]', index, info)

    const taskPromise = taskQueue.pushTask(asyncTask)
    infoQueue.unshift(info)
    infoQueue.length = taskQueue.getLength() // lazy info drop
    __DEV__ && console.log('[pushTask] infoQueue.length', infoQueue.length)

    return taskPromise
  }

  return { reset, getStatus, trimInfoQueue, pushTask }
}

const selectMinLoadLane = (laneList) => laneList.reduce(
  (o, lane) => o.taskQueue.getLength() > lane.taskQueue.getLength() ? lane : o,
  laneList[ 0 ]
)

export {
  createAsyncTaskLane,
  selectMinLoadLane
}
