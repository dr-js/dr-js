import { strictEqual, notStrictEqual, stringifyEqual } from 'source/common/verify'
import { setTimeoutAsync } from 'source/common/time'
import {
  ASYNC_TASK_PHASE_MAP,
  ASYNC_TASK_KEY_MAP,
  getAsyncTaskPhase,
  runAsyncTask,
  resetAsyncTask
} from './AsyncTask'

const { describe, it } = global

const { IDLE, RUN, DONE } = ASYNC_TASK_PHASE_MAP
const { PLAN, PLAN_PROMISE, QUERY, PROMISE, OUTPUT } = ASYNC_TASK_KEY_MAP

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

describe('source/common/module/AsyncTask', () => {
  it('basic usage', async () => {
    const asyncTask = getAsyncTask()

    strictEqual(getAsyncTaskPhase(asyncTask), IDLE)

    const promise = runAsyncTask(asyncTask)
    strictEqual(getAsyncTaskPhase(asyncTask), RUN)
    strictEqual(promise, asyncTask[ PROMISE ])
    strictEqual(asyncTask.extraValue, extraValue, 'allow introduce new data, maybe a bad idea')

    const queryResultList = [
      await asyncTask[ QUERY ](''),
      await asyncTask[ QUERY ](''),
      await asyncTask[ QUERY ]('')
    ]
    // console.log(queryResultList)
    stringifyEqual(queryResultList, [ 0, 1, 2 ])
    strictEqual(getAsyncTaskPhase(asyncTask), RUN) // should not take 32ms yet

    const output = await promise
    // console.log(output)
    stringifyEqual(output, { result: outputResult, error: undefined })
    strictEqual(getAsyncTaskPhase(asyncTask), DONE)
    strictEqual(output, asyncTask[ OUTPUT ])
    strictEqual(await asyncTask[ QUERY ](''), 'already done')
  })

  it('output for error', async () => {
    const asyncTask = getAsyncTask()
    const promise = runAsyncTask(asyncTask)
    const queryResultList = [
      await asyncTask[ QUERY ](''),
      await asyncTask[ QUERY ]('bail'),
      await asyncTask[ QUERY ]('')
    ]
    stringifyEqual(queryResultList, [ 0, 1, 2 ])
    const output = await promise
    stringifyEqual(output, { result: undefined, error: outputError })
  })

  it('direct error', async () => {
    const promise = runAsyncTask({
      [ PLAN ]: () => ({
        [ PLAN_PROMISE ]: Promise.reject(outputError),
        [ QUERY ]: async (type) => {}
      })
    })
    const output = await promise
    stringifyEqual(output, { result: undefined, error: outputError })
  })

  it('resetAsyncTask', async () => {
    const asyncTask = getAsyncTask()
    await runAsyncTask(asyncTask)
    strictEqual(getAsyncTaskPhase(asyncTask), DONE)

    const asyncTaskNew = resetAsyncTask(asyncTask)
    notStrictEqual(asyncTaskNew, asyncTask, 'should return different object')
    strictEqual(getAsyncTaskPhase(asyncTaskNew), IDLE, 'should reset non-idle phase data')
  })
})
