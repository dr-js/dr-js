// special store, state is href string

const createHistoryStateStore = (state = window.location.href) => {
  const getState = () => {
    if (listenerSet.size === 0) throw new Error('[createHistoryStateStore] should not getState before subscribe')
    return state
  }
  const setState = (nextState, shouldPushState) => {
    if (typeof (nextState) !== 'string') throw new Error(`[createHistoryStateStore] unexpected non-string href: ${nextState}`)
    if (nextState === state) return state
    const prevState = state
    state = nextState
    shouldPushState !== 'skip' && window.history.pushState(null, '', state)
    listenerSet.forEach((listener) => listener(state, prevState))
    return state
  }
  const listenerPopState = () => { setState(window.location.href, 'skip') }
  const listenerHashChange = () => { setState(window.location.href) }
  const listenerSet = new Set()
  const subscribe = (listener) => {
    listenerSet.add(listener)
    if (listenerSet.size !== 1) return
    window.addEventListener('popstate', listenerPopState)
    window.addEventListener('hashchange', listenerHashChange)
  }
  const unsubscribe = (listener) => {
    listenerSet.delete(listener)
    if (listenerSet.size !== 0) return
    window.removeEventListener('popstate', listenerPopState)
    window.removeEventListener('hashchange', listenerHashChange)
  }
  return { getState, setState, subscribe, unsubscribe }
}

export { createHistoryStateStore }
