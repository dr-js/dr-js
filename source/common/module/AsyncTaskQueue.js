import { getTimestamp } from 'source/common/time'
import { createAsyncFuncQueue } from './AsyncFuncQueue'
import { ASYNC_TASK_KEY_MAP, runAsyncTask } from './AsyncTask'

const { PLAN_PROMISE, OUTPUT } = ASYNC_TASK_KEY_MAP

const STATUS = 'status'
const ASYNC_TASK_QUEUE_KEY_MAP = {
  ...ASYNC_TASK_KEY_MAP,
  STATUS
}

// ## AsyncTaskQueue ##
//   better for maintain long running work or resource heavy process
//   add status with basic time mark
const createAsyncTaskQueue = () => {
  const { getLength, reset, push: pushAsyncFunc } = createAsyncFuncQueue()

  const push = (asyncTask) => {
    asyncTask[ STATUS ] = { // always assign a new state
      pushAt: getTimestamp(), // in second
      runAt: undefined, // in second
      doneAt: undefined // in second
    }
    return pushAsyncFunc(() => {
      asyncTask[ STATUS ].runAt = getTimestamp()
      const promise = runAsyncTask(asyncTask)
      const onTaskDone = () => { asyncTask[ STATUS ].doneAt = getTimestamp() }
      asyncTask[ PLAN_PROMISE ].then(onTaskDone, onTaskDone) // this will run before asyncTask[ PROMISE ], so both OUTPUT and STATUS data can be ready for done phase
      return promise // pass to outer code
    })
  }

  return { getLength, reset, push }
}

const createFilterStaleAsyncTask = (
  maxStaleTime, // in second (set 600 to filter task ended for >=10min)
  maxDoneAt = getTimestamp() - Math.abs(maxStaleTime)
) => (asyncTask) => (
  !asyncTask[ OUTPUT ] || // task is not done
  asyncTask[ STATUS ].doneAt > maxDoneAt // not match time range
)

export {
  ASYNC_TASK_QUEUE_KEY_MAP,
  createAsyncTaskQueue,
  createFilterStaleAsyncTask
}
