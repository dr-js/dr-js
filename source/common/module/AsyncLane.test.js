import { strictEqual, stringifyEqual, doThrow } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import { ASYNC_TASK_KEY_MAP, runAsyncTask } from './AsyncTask'
import { createAsyncFuncQueue } from './AsyncFuncQueue'
import {
  createAsyncLane,
  extendAutoSelectLane, selectMinLoadLane,
  // extendLaneValueList,
  // extendLaneValueMap
  extendAutoSelectByTagLane, selectByTagOrMinLoadLane
} from './AsyncLane'

const { describe, it } = global

const { PLAN, PLAN_PROMISE, QUERY, OUTPUT } = ASYNC_TASK_KEY_MAP

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

describe('source/common/module/AsyncLane', () => {
  it('basic usage', async () => {
    const asyncFuncLane = createAsyncLane({
      laneSize: 4,
      createAsyncQueue: createAsyncFuncQueue
    })

    stringifyEqual(asyncFuncLane.getStatus(), [ 0, 0, 0, 0 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 0 },
      { index: 1, length: 0 },
      { index: 2, length: 0 },
      { index: 3, length: 0 }
    ])

    const asyncTask0 = getAsyncTask()
    const asyncTask1 = getAsyncTask()
    const asyncTask2 = getAsyncTask()
    const asyncTask3 = getAsyncTask()
    const asyncTask4 = getAsyncTask()
    const asyncTask5 = getAsyncTask()

    const promise0 = asyncFuncLane.push(() => runAsyncTask(asyncTask0), 0)
    const promise1 = asyncFuncLane.push(() => runAsyncTask(asyncTask1), 1)
    const promise2 = asyncFuncLane.push(() => runAsyncTask(asyncTask2), 2)
    const promise3 = asyncFuncLane.push(() => runAsyncTask(asyncTask3), 3)

    stringifyEqual(asyncFuncLane.getStatus(), [ 1, 1, 1, 1 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 1 },
      { index: 1, length: 1 },
      { index: 2, length: 1 },
      { index: 3, length: 1 }
    ])

    const promise4 = asyncFuncLane.push(() => runAsyncTask(asyncTask4), 0)
    const promise5 = asyncFuncLane.push(() => runAsyncTask(asyncTask5), 1)

    stringifyEqual(asyncFuncLane.getStatus(), [ 2, 2, 1, 1 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 2 },
      { index: 1, length: 2 },
      { index: 2, length: 1 },
      { index: 3, length: 1 }
    ])

    doThrow(() => asyncFuncLane.push(() => {}, -1), 'should error when wrong laneIndex is given')
    stringifyEqual(asyncFuncLane.getStatus(), [ 2, 2, 1, 1 ])

    await promise3 // should have finished first batch
    // console.log(asyncFuncLane.getStatus())
    stringifyEqual(asyncFuncLane.getStatus(), [ 1, 1, 0, 0 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 1 },
      { index: 1, length: 1 },
      { index: 2, length: 0 },
      { index: 3, length: 0 }
    ])

    await Promise.all([ promise0, promise1, promise2, promise3, promise4, promise5 ])

    stringifyEqual(asyncFuncLane.getStatus(), [ 0, 0, 0, 0 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 0 },
      { index: 1, length: 0 },
      { index: 2, length: 0 },
      { index: 3, length: 0 }
    ])
  })

  it('asyncLane.reset', async () => {
    const asyncFuncLane = createAsyncLane({
      laneSize: 4,
      createAsyncQueue: createAsyncFuncQueue
    })

    const asyncTask0 = getAsyncTask()
    const asyncTask1 = getAsyncTask()
    const asyncTask2 = getAsyncTask()
    const asyncTask3 = getAsyncTask()
    const asyncTask4 = getAsyncTask()
    const asyncTask5 = getAsyncTask()

    const promise0 = asyncFuncLane.push(() => runAsyncTask(asyncTask0), 0)
    const promise1 = asyncFuncLane.push(() => runAsyncTask(asyncTask1), 1)
    const promise2 = asyncFuncLane.push(() => runAsyncTask(asyncTask2), 2)
    const promise3 = asyncFuncLane.push(() => runAsyncTask(asyncTask3), 3)
    const promise4 = asyncFuncLane.push(() => runAsyncTask(asyncTask4), 0)
    const promise5 = asyncFuncLane.push(() => runAsyncTask(asyncTask5), 1)

    stringifyEqual(asyncFuncLane.getStatus(), [ 2, 2, 1, 1 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 2 },
      { index: 1, length: 2 },
      { index: 2, length: 1 },
      { index: 3, length: 1 }
    ])

    asyncFuncLane.reset()

    stringifyEqual(asyncFuncLane.getStatus(), [ 0, 0, 0, 0 ])
    stringifyEqual(asyncFuncLane.getStatus(true), [
      { index: 0, length: 0 },
      { index: 1, length: 0 },
      { index: 2, length: 0 },
      { index: 3, length: 0 }
    ])

    await Promise.all([ promise0, promise1, promise2, promise3 ]) // these should started, and will finish

    strictEqual(
      await Promise.race([
        setTimeoutAsync(32 + 8).then(() => 'wait end'),
        promise4, promise5 // these should get dropped, and never start
      ]),
      'wait end'
    )
  })

  it('extendAutoSelectLane + selectMinLoadLane', async () => {
    const asyncFuncAutoSelectLane = extendAutoSelectLane(
      createAsyncLane({
        laneSize: 4,
        createAsyncQueue: createAsyncFuncQueue
      }),
      selectMinLoadLane
    )

    const asyncTask0 = getAsyncTask()
    const asyncTask1 = getAsyncTask()
    const asyncTask2 = getAsyncTask()
    const asyncTask3 = getAsyncTask()
    const asyncTask4 = getAsyncTask()
    const asyncTask5 = getAsyncTask()

    const promise0 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask0) /* , 0 */)
    const promise1 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask1) /* , 1 */)
    const promise2 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask2) /* , 2 */)
    const promise3 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask3) /* , 3 */)
    const promise4 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask4) /* , 0 */)
    const promise5 = asyncFuncAutoSelectLane.pushAuto(() => runAsyncTask(asyncTask5) /* , 1 */)

    stringifyEqual(asyncFuncAutoSelectLane.getStatus(), [ 2, 2, 1, 1 ])
    stringifyEqual(asyncFuncAutoSelectLane.getStatus(true), [
      { index: 0, length: 2 },
      { index: 1, length: 2 },
      { index: 2, length: 1 },
      { index: 3, length: 1 }
    ])

    await Promise.all([ promise0, promise1, promise2, promise3, promise4, promise5 ]) // make linter happy
  })

  it('extendAutoSelectByTagLane + selectByTagOrMinLoadLane', async () => {
    const asyncFuncAutoSelectByTagLane = extendAutoSelectByTagLane(
      createAsyncLane({
        laneSize: 4,
        createAsyncQueue: createAsyncFuncQueue
      }),
      selectByTagOrMinLoadLane
    )

    const asyncTask0 = getAsyncTask()
    const asyncTask1 = getAsyncTask()
    const asyncTask2 = getAsyncTask()
    const asyncTask3 = getAsyncTask()
    const asyncTask4 = getAsyncTask()
    const asyncTask5 = getAsyncTask()

    const promise0 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask0), 0)
    const promise1 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask1), 1)
    const promise2 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask2), 2)
    const promise3 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask3), 3)
    const promise4 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask4), 2)
    const promise5 = asyncFuncAutoSelectByTagLane.pushAutoTag(() => runAsyncTask(asyncTask5), 9)

    stringifyEqual(asyncFuncAutoSelectByTagLane.getStatus(), [ 2, 1, 2, 1 ])
    stringifyEqual(asyncFuncAutoSelectByTagLane.getStatus(true), [
      { index: 0, length: 2, tagList: [ 9, 0 ] },
      { index: 1, length: 1, tagList: [ 1 ] },
      { index: 2, length: 2, tagList: [ 2, 2 ] },
      { index: 3, length: 1, tagList: [ 3 ] }
    ])

    await Promise.all([ promise0, promise1, promise2, promise3, promise4, promise5 ]) // make linter happy
  })
})
