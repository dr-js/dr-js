// special store, state is href string, and no getState method

const createHistoryStateStore = (state = window.location.href) => {
  const getState = () => {
    if (listenerSet.size === 0) throw new Error('[createHistoryStateStore] should not getState before subscribe')
    return state
  }
  const setState = (nextState) => {
    if (nextState === state) return state
    if (__DEV__ && typeof (nextState) !== 'string') throw new Error(`[createHistoryStateStore] unexpected non-string href: ${nextState}`)
    const prevState = state
    state = nextState
    window.history.pushState(null, '', nextState)
    listenerSet.forEach((listener) => listener(state, prevState))
    return state
  }
  const listenerHistoryState = () => { setState(window.location.href) }
  const listenerSet = new Set()
  const subscribe = (listener) => {
    if (listenerSet.size === 0) {
      window.addEventListener('popstate', listenerHistoryState)
      window.addEventListener('hashchange', listenerHistoryState)
    }
    listenerSet.add(listener)
  }
  const unsubscribe = (listener) => {
    listenerSet.delete(listener)
    if (listenerSet.size === 0) {
      window.removeEventListener('popstate', listenerHistoryState)
      window.removeEventListener('hashchange', listenerHistoryState)
    }
  }
  return { getState, setState, subscribe, unsubscribe }
}

export { createHistoryStateStore }
