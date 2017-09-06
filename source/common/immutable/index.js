import { ImmutableOperation } from './ImmutableOperation'

export { immutableTransformCache, createImmutableTransformCacheWithInfo } from './__utils__'
export { ImmutableOperation } from './ImmutableOperation'

const { objectMerge } = ImmutableOperation

const createStateStore = (state) => {
  const getState = () => state
  const setState = (nextState) => {
    nextState = objectMerge(state, nextState)
    if (nextState === state) return state
    const prevState = state
    state = nextState
    listenerSet.forEach((listener) => listener(state, prevState))
    return state
  }
  const listenerSet = new Set()
  const subscribe = (listener) => listenerSet.add(listener)
  const unsubscribe = (listener) => listenerSet.delete(listener)
  return { getState, setState, subscribe, unsubscribe }
}

const createMinStateStore = (state) => ({
  getState: () => state,
  setState: (nextState) => (state = { ...state, ...nextState })
})

export {
  createStateStore,
  createMinStateStore
}
