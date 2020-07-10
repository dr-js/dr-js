import { basicObject, basicFunction, promiseAlike } from 'source/common/verify'
import { catchPromise } from 'source/common/error'

// ## AsyncTask ##
//   a data structure to allow saving resource heavy code to run later
//   hold all of the idle/run/done phase data
//   contain a promise te represent the running code
//   and async query func to allow external code interact with code inside the promise

const IDLE = 'idle'
const RUN = 'run'
const DONE = 'done'

const ASYNC_TASK_PHASE_MAP = {
  IDLE,
  RUN,
  DONE
}

// NOTE:
//   if for convenience the value is directly used in code
//   better add verify code like `strictEqual(ASYNC_TASK_KEY_MAP.OUTPUT, 'output')`

const PLAN = 'plan'
const PROMISE = 'promise'
const QUERY = 'query'
const PLAN_PROMISE = 'planPromise'
const OUTPUT = 'output'

const ASYNC_TASK_KEY_MAP = {
  PLAN, // idle phase data
  PROMISE, QUERY, PLAN_PROMISE, // run phase data
  OUTPUT // done phase data
}

const KEY_RESET = {
  // [ PLAN ]: undefined, // keep idle phase data
  [ PLAN_PROMISE ]: undefined, [ QUERY ]: undefined, [ PROMISE ]: undefined, // drop run phase data
  [ OUTPUT ]: undefined // drop done phase data
}

// NOTE: what this try to solve:
//   it's convenient to using promise to hold a running `task`
//   but there lack way to interact with code inside the running task
//   for example:
//   - promise timeout have no way to tell the inside code to exit ASAP
//   - and current promise timeout code will leave the resource heavy promise running free
//   - other code can follow this pattern to provide control, like `run()` from `source/node/system/Run`
__DEV__ && console.log('SAMPLE_ASYNC_TASK', {
  // idle phase data
  [ PLAN ]: (SAMPLE_ASYNC_TASK, ...extraOptionalArgList) => ({ // this pattern allow re-use same func with different config. better if is pure function, currently must be sync (async needed?)
    // currently the task object is used to track the task change, so itself can't be immutable
    // outer code should just assign the result back to the task object and re-use
    // only re-create when a "new" task is needed, like copy
    [ PLAN_PROMISE ]: Promise,
    [ QUERY ]: async (type) => {}
  }),

  // run phase data
  [ PLAN_PROMISE ]: Promise, // the running task, one `then` before OUTPUT is collected, will resolve and reject
  [ QUERY ]: (
    // required, provide an async way to interact with the code inside the running task
    // this can be used as:
    //   - getState: async () => ({ ... })
    //   - cancel: async (reason) => {}
    (async (type) => {}) || // default, nothing happen
    (async (type, payload) => {}) || // recommended Redux dispatch pattern: `async (type, payload) => resolveToResultStateOrRejectWithError`
    (async (type, ...extraOptionalArgList) => { // use as async emit, for retrieving state, or try to cancel early
      if (type === 'get:state') return { state: 'still running' }
      if (type === 'cancel') {} // do something to make task promise resolve/reject faster
      if (type === 'get:value') return 'the value' // receive value and
      if (type === 'set:value') {} // change value and alter the task behaviour?
    })
  ),
  [ PROMISE ]: Promise, // indicate the end of run phase, resolve to `{ result, error }`, no reject, after OUTPUT is set

  // done phase data
  [ OUTPUT ]: undefined || { // if both have value, pick error, and always check error since result can actually be undefined
    error: undefined || Error,
    result: undefined || 'Any'
  },

  // optional extra data
  id: '123abcABC',
  name: 'sample asyncTask',
  config: { data: 1 } // can pass extra data to plan func when creating task
  // readyState: 0, // optional run phase data, direct expose the running state/progress, like `XMLHttpRequest.readyState`
})

const getAsyncTaskPhase = (asyncTask) => asyncTask[ OUTPUT ] ? DONE
  : asyncTask[ PROMISE ] ? RUN
    : IDLE

const runAsyncTask = (asyncTask) => { // re-run will overwrite existing `promise/query`
  if (__DEV__ && getAsyncTaskPhase(asyncTask) !== IDLE) throw new Error('should reset asyncTask to idle')

  const planResult = asyncTask[ PLAN ](asyncTask)

  if (__DEV__ && !basicObject(planResult)) throw new Error('expect asyncTask[ PLAN ] to return object')

  if (planResult !== asyncTask) Object.assign(asyncTask, planResult) // merge back and re-use same task object

  __DEV__ && promiseAlike(asyncTask[ PLAN_PROMISE ])
  __DEV__ && basicFunction(asyncTask[ QUERY ])

  asyncTask[ PROMISE ] = catchPromise(asyncTask[ PLAN_PROMISE ]) // should not reject
    .then((output) => (asyncTask[ OUTPUT ] = output)) // record output as { result, error }

  return asyncTask[ PROMISE ]
}

const resetAsyncTask = (asyncTask, extra) => ({ ...asyncTask, ...extra, ...KEY_RESET }) // return a new idle asyncTask

export {
  ASYNC_TASK_PHASE_MAP,
  ASYNC_TASK_KEY_MAP,
  getAsyncTaskPhase,
  runAsyncTask,
  resetAsyncTask
}
