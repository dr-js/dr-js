import { basicObject as verifyBasicObject, basicFunction as verifyBasicFunction } from 'source/common/verify'
import { objectMerge } from './Object'
import { arrayMatchPush, arrayMatchDelete } from './Array'

const createStateStore = (state) => {
  verifyBasicObject(state, 'initialState should be basic Object')
  let listenerList = []
  const subscribe = (listener) => { listenerList = arrayMatchPush(listenerList, listener) }
  const unsubscribe = (listener) => { listenerList = arrayMatchDelete(listenerList, listener) }
  const getState = () => state
  const setState = (nextState) => {
    verifyBasicObject(nextState, 'state should be basic Object')
    nextState = objectMerge(state, nextState)
    if (nextState === state) return state
    const prevState = state
    state = nextState
    listenerList.forEach((listener) => listener(state, prevState))
    return state
  }
  return { subscribe, unsubscribe, getState, setState }
}

// for basic use, no merge check & listener for speed
const createStateStoreLite = (state) => ({
  getState: () => state,
  setState: (nextState) => (state = { ...state, ...nextState })
})

// for redux-like use
const createStateStoreEnhanced = ({ initialState, enhancer, reducer }) => {
  verifyBasicFunction(enhancer, 'enhancer function required')
  verifyBasicFunction(reducer, 'reducer function required')
  const { subscribe, unsubscribe, getState: getStoreState, setState: setStoreState } = createStateStore(initialState)

  let dispatchingState = null
  let isDispatching = false
  let isReducing = false

  const rootDispatch = (action) => {
    dispatchingState = getStoreState()

    isDispatching = true
    enhancer(enhancerStore, action) // may trigger deeper dispatch
    if (!dispatchingState) throw new Error(`dispatchingState after enhancer is invalid, get: ${JSON.stringify(dispatchingState)}`)
    isDispatching = false

    isReducing = true
    const nextState = reducer(dispatchingState, action) // should not trigger dispatch
    isReducing = false

    dispatchingState = null

    setStoreState(nextState) // may trigger deeper dispatch
  }

  const subDispatch = (action) => {
    if (isReducing) throw new Error(`got reducer caused dispatching, action: ${JSON.stringify(action)}`)
    enhancer(enhancerStore, action)
    dispatchingState = reducer(dispatchingState, action)
    verifyBasicObject(dispatchingState, 'reducer should return basic Object state')
  }

  const getState = () => !isDispatching ? getStoreState() : dispatchingState

  const dispatch = (action) => {
    verifyBasicObject(action, 'action should be basic Object')
    return !isDispatching ? rootDispatch(action) : subDispatch(action)
  }

  const enhancerStore = { getState, dispatch }

  return { subscribe, unsubscribe, getState, dispatch }
}

// for redux-like use, store should be createStateStore or createStateStoreEnhanced
const toReduxStore = (store) => {
  const { subscribe: subscribeStore, unsubscribe } = store
  verifyBasicFunction(subscribeStore, 'store.subscribe required')
  verifyBasicFunction(unsubscribe, 'store.unsubscribe required')
  const subscribe = (listener) => { // merge unsubscribe into subscribe
    subscribeStore(listener)
    return () => unsubscribe(listener)
  }
  return { ...store, subscribe }
}

const reducerFromMap = (reducerMap) => { // redux combineReducers
  const keyList = Object.keys(reducerMap)
  const keyListLength = keyList.length
  return (state, action) => {
    const nextState = {}
    let isChanged = false
    for (let index = 0; index < keyListLength; index++) {
      const key = keyList[ index ]
      const keyState = state[ key ]
      const nextKeyState = reducerMap[ key ](keyState, action)
      nextState[ key ] = nextKeyState
      isChanged = isChanged || (nextKeyState !== keyState)
    }
    return isChanged ? nextState : state
  }
}

const createEntryEnhancer = (entryMap) => (enhancerStore, action) => { // redux-entry like enhancer
  const entryFunction = entryMap[ action.type ]
  return entryFunction && entryFunction(enhancerStore, action)
}

const createStoreStateSyncReducer = (actionType, { getState, setState }) => (state, { type, payload }) => { // redux-entry like state sync reducer
  type === actionType && setState(payload)
  return getState()
}

export {
  createStateStore,
  createStateStoreLite,
  createStateStoreEnhanced,
  toReduxStore,
  reducerFromMap,
  createEntryEnhancer,
  createStoreStateSyncReducer
}
