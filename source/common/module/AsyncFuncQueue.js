import { createInsideOutPromise } from 'source/common/function.js'

// NOTE: simple size reduction for minify
const GET_SIZE = 'A'
const ADD_SIZE = 'B'
const SUB_SIZE = 'C'
const GET_IS_VALID = 'D'
const SET_INVALID = 'E'

const createQueueStatus = (
  size = 0,
  isValid = true
) => ({
  [ GET_SIZE ]: () => size,
  [ ADD_SIZE ]: () => ++size,
  [ SUB_SIZE ]: () => --size,
  [ GET_IS_VALID ]: () => isValid,
  [ SET_INVALID ]: () => (isValid = false)
})

// ## AsyncFuncQueue ##
//   for maintain a linear execution order for list of function
//   good for queue up small fire & forgot function
//   only provide total length, not query for each func
const createAsyncFuncQueue = () => {
  let queueStatus = createQueueStatus()
  let queueTail = Promise.resolve() // queue head

  const getLength = () => queueStatus[ GET_SIZE ]()
  const getTailPromise = () => queueTail // for this moment, will not wait for later push

  const reset = () => { // break previous queue, reset status
    // NOTE:
    //   current running func will run to end, and funcPromise can get resolved
    //   but remaining queue func will not get called and funcPromise will not get resolved
    //   so for code using reset, consider:
    //    - use a droppable queue structure, so code after funcPromise can be safely skipped
    //    - setup timeout if important outer code depend on funcPromise to resolve
    queueStatus[ SET_INVALID ]() // break previous queue, will prevent later queue func from running
    queueStatus = createQueueStatus()
    queueTail = Promise.resolve() // queue head
  }

  const push = (asyncFunc) => { // should be async func, though normal func is technically ok, and NOTE passing non-function will NOT result in error
    const { promise: queuePromise, resolve } = createInsideOutPromise()
    queueStatus[ ADD_SIZE ]()
    const currentQueueStatus = queueStatus // lock queueStatus reference in function, so later queueStatus can reset to new one
    const onSettle = () => {
      currentQueueStatus[ SUB_SIZE ]()
      currentQueueStatus[ GET_IS_VALID ]() && resolve() // allow promise queue to break
    }
    const asyncFuncPromise = queueTail.then(asyncFunc)
    asyncFuncPromise.then(onSettle, onSettle) // be the first to then, update the queue status so later then code can get consistent queue length
    queueTail = queuePromise // promise is not chained up directly to support chain break
    return asyncFuncPromise // for wait & get result from asyncFunc
  }

  return { getLength, getTailPromise, reset, push }
}

export { createAsyncFuncQueue }
