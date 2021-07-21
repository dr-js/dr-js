import { strictEqual, notStrictEqual, stringifyEqual } from 'source/common/verify.js'
import { setTimeoutAsync } from 'source/common/time.js'
import { ASYNC_TASK_PHASE_MAP, getAsyncTaskPhase } from './AsyncTask.js'
import {
  ASYNC_TASK_QUEUE_KEY_MAP,
  createAsyncTaskQueue,
  createFilterStaleAsyncTask
} from './AsyncTaskQueue.js'

const { describe, it } = globalThis

const { IDLE, RUN, DONE } = ASYNC_TASK_PHASE_MAP
const { PLAN, PLAN_PROMISE, QUERY, PROMISE, OUTPUT, STATUS } = ASYNC_TASK_QUEUE_KEY_MAP

const extraValue = {}
const outputResult = { output: 'result' }
const outputError = new Error('output')
const asyncTaskPlan = (asyncTask) => {
  let queryCount = 0
  let bail = false
  return {
    [ PLAN_PROMISE ]: setTimeoutAsync(32).then(() => {
      if (bail) throw outputError
      return outputResult
    }),
    [ QUERY ]: async (type) => {
      if (asyncTask[ OUTPUT ]) return 'already done'
      if (type === 'bail') bail = true
      return queryCount++
    },
    extraValue
  }
}
const getAsyncTask = () => ({ [ PLAN ]: asyncTaskPlan })

describe('source/common/module/AsyncTaskQueue', () => {
  it('createAsyncTaskQueue basic', async () => {
    const asyncTaskQueue = createAsyncTaskQueue()

    const asyncTask = getAsyncTask()

    strictEqual(asyncTaskQueue.getLength(), 0)
    const promise = asyncTaskQueue.push(asyncTask)
    strictEqual(asyncTaskQueue.getLength(), 1)
    strictEqual(typeof (asyncTask[ STATUS ].pushAt), 'number')

    const output = await promise
    strictEqual(asyncTaskQueue.getLength(), 0)
    strictEqual(output, asyncTask[ OUTPUT ])
  })

  it('createAsyncTaskQueue multi', async () => {
    const asyncTaskQueue = createAsyncTaskQueue()

    const asyncTask0 = getAsyncTask()
    const asyncTask1 = getAsyncTask()
    const asyncTask2 = getAsyncTask()
    const asyncTask3 = getAsyncTask()
    const asyncTask4 = getAsyncTask()

    strictEqual(asyncTaskQueue.getLength(), 0)
    const promise0 = asyncTaskQueue.push(asyncTask0)
    const promise1 = asyncTaskQueue.push(asyncTask1)
    const promise2 = asyncTaskQueue.push(asyncTask2)
    const promise3 = asyncTaskQueue.push(asyncTask3)
    const promise4 = asyncTaskQueue.push(asyncTask4)
    strictEqual(asyncTaskQueue.getLength(), 5)

    strictEqual(typeof (asyncTask0[ STATUS ].pushAt), 'number')
    strictEqual(typeof (asyncTask4[ STATUS ].pushAt), 'number')

    await promise1
    strictEqual(getAsyncTaskPhase(asyncTask2), IDLE)
    await Promise.resolve() // wait for asyncTask2 to run
    strictEqual(getAsyncTaskPhase(asyncTask2), RUN)
    asyncTask2[ QUERY ]('')

    notStrictEqual(promise0, asyncTask0[ PROMISE ]) // with extra warp from AsyncFuncQueue

    strictEqual(asyncTaskQueue.getLength(), 3)
    stringifyEqual(asyncTask0[ OUTPUT ], { result: outputResult, error: undefined })
    stringifyEqual(asyncTask1[ OUTPUT ], { result: outputResult, error: undefined })
    stringifyEqual(asyncTask2[ OUTPUT ], undefined)
    stringifyEqual(asyncTask3[ OUTPUT ], undefined)
    stringifyEqual(asyncTask4[ OUTPUT ], undefined)

    await promise2
    strictEqual(getAsyncTaskPhase(asyncTask0), DONE)
    strictEqual(getAsyncTaskPhase(asyncTask1), DONE)
    strictEqual(getAsyncTaskPhase(asyncTask2), DONE)

    strictEqual(getAsyncTaskPhase(asyncTask3), IDLE)
    await Promise.resolve() // wait for asyncTask3 to run
    strictEqual(getAsyncTaskPhase(asyncTask3), RUN)
    asyncTask3[ QUERY ]('bail')

    const output4 = await promise4
    strictEqual(output4, asyncTask4[ OUTPUT ])
    strictEqual(asyncTaskQueue.getLength(), 0)
    stringifyEqual(asyncTask0[ OUTPUT ], { result: outputResult, error: undefined })
    stringifyEqual(asyncTask1[ OUTPUT ], { result: outputResult, error: undefined })
    stringifyEqual(asyncTask2[ OUTPUT ], { result: outputResult, error: undefined })
    stringifyEqual(asyncTask3[ OUTPUT ], { result: undefined, error: outputError })
    stringifyEqual(asyncTask4[ OUTPUT ], { result: outputResult, error: undefined })

    await Promise.all([ promise0, promise1, promise2, promise3, promise4 ]) // make linter happy
  })

  it('createFilterStaleAsyncTask', async () => {
    const filterStaleAsyncTask = createFilterStaleAsyncTask(
      0, // if second arg is set, this is not used
      1
    )

    strictEqual(filterStaleAsyncTask({ [ OUTPUT ]: undefined, [ STATUS ]: { doneAt: undefined } }), true) // not done
    strictEqual(filterStaleAsyncTask({ [ OUTPUT ]: {}, [ STATUS ]: { doneAt: 2 } }), true) // done but not stale
    strictEqual(filterStaleAsyncTask({ [ OUTPUT ]: {}, [ STATUS ]: { doneAt: 1 } }), false) // just stale
    strictEqual(filterStaleAsyncTask({ [ OUTPUT ]: {}, [ STATUS ]: { doneAt: 0 } }), false) // stale
  })
})
