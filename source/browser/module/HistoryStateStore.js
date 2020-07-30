// special store, state is href string

const { location, history } = window

const createHistoryStateStore = (state = location.href) => {
  const getState = () => {
    if (listenerSet.size === 0) throw new Error('should subscribe before getState')
    return state
  }
  const setState = (nextState, shouldPushState) => {
    if (typeof (nextState) !== 'string') throw new Error(`non-string href: ${nextState}`)
    if (nextState === state) return state
    const prevState = state
    state = nextState
    shouldPushState !== 'skip' && history.pushState(null, '', state)
    listenerSet.forEach((listener) => listener(state, prevState))
    return state
  }
  const listenerPopState = () => { setState(location.href, 'skip') }
  const listenerHashChange = () => { setState(location.href) }
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
