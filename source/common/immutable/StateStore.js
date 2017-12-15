import { basicObject as verifyBasicObject, basicFunction as verifyBasicFunction } from 'source/common/verify'
import { objectMerge, arrayMatchPush, arrayMatchDelete } from './ImmutableOperation'

const createStateStore = (state) => {
  verifyBasicObject(state, '[createStateStore] initialState should be basic Object')
  let listenerList = []
  const subscribe = (listener) => { listenerList = arrayMatchPush(listenerList, listener) }
  const unsubscribe = (listener) => { listenerList = arrayMatchDelete(listenerList, listener) }
  const getState = () => state
  const setState = (nextState) => {
    verifyBasicObject(nextState, '[setState] state should be basic Object')
    nextState = objectMerge(state, nextState)
    if (nextState === state) return state
    const prevState = state
    state = nextState
    listenerList.forEach((listener) => listener(state, prevState))
    return state
  }
  return { subscribe, unsubscribe, getState, setState }
}

// for basic use, no check for speed
const createStateStoreLite = (state) => ({
  getState: () => state,
  setState: (nextState) => (state = { ...state, ...nextState }) // TODO: CHECK: if should use `objectMerge`
})

// for Redux-like use
const createStateStoreEnhanced = ({
  initialState,
  enhancer,
  reducer
}) => {
  verifyBasicFunction(enhancer, '[createStateStoreEnhanced] enhancer function required')
  verifyBasicFunction(reducer, '[createStateStoreEnhanced] reducer function required')
  const { subscribe, unsubscribe, getState: getStoreState, setState: setStoreState } = createStateStore(initialState)

  let dispatchingState = null
  let isDispatching = false
  let isReducing = false

  const rootDispatch = (action) => {
    dispatchingState = getStoreState()
    isDispatching = true

    enhancer(enhancerStore, action)
    if (!dispatchingState) throw new Error(`[rootDispatch] dispatchingState from enhancer is invalid, get: ${JSON.stringify(dispatchingState)}`)

    isReducing = true
    const nextState = reducer(dispatchingState, action)
    setStoreState(nextState)
    isReducing = false

    dispatchingState = null
    isDispatching = false
  }

  const subDispatch = (action) => {
    if (isReducing) throw new Error(`[subDispatch] got reducer caused dispatching, action: ${JSON.stringify(action)}`)
    enhancer(enhancerStore, action)
    dispatchingState = reducer(dispatchingState, action)
    verifyBasicObject(dispatchingState, '[subDispatch] reducer should return basic Object state')
  }

  const getState = () => !isDispatching
    ? getStoreState()
    : dispatchingState

  const dispatch = (action) => {
    verifyBasicObject(action, '[dispatch] action should be basic Object')
    return !isDispatching
      ? rootDispatch(action)
      : subDispatch(action)
  }

  const enhancerStore = { getState, dispatch }

  return { subscribe, unsubscribe, getState, dispatch }
}

export {
  createStateStore,
  createStateStoreLite,
  createStateStoreEnhanced
}
