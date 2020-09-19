import { isCompactArrayShallowEqual } from 'source/common/immutable/check'

const { localStorage } = window

// sync save and load
// "immutable" state, default persist through JSON, so complex Object will be recreated, but when using single storage from start to end, the state can be considered immutable
// operate at the sub-state 1 level deeper, so to get good performance, the state structure may need some design or twist

const createLocalStorageStateStore = ({
  keyPrefix = 'STATE', keyListKey = '@@KEY_LIST', // for multi storage setup
  setItem = (key, value) => localStorage.setItem(`${keyPrefix}|${key}`, JSON.stringify(value)),
  getItem = (key) => JSON.parse(localStorage.getItem(`${keyPrefix}|${key}`)),
  removeItem = (key) => localStorage.removeItem(`${keyPrefix}|${key}`)
}) => {
  let persistState = {}
  let persistKeyList = []

  const save = (state) => { // set the whole state, so maybe debounce a bit
    // __DEV__ && console.log('[save] state:', state)
    const keyList = Object.keys(state)
    for (const key of keyList) {
      __DEV__ && persistState[ key ] !== state[ key ] && console.log('[save] save key:', key)
      persistState[ key ] !== state[ key ] && setItem(key, state[ key ])
    }
    for (const key of persistKeyList) {
      __DEV__ && !state[ key ] && console.log('[save] drop key:', key)
      !state[ key ] && removeItem(key)
    }
    if (!isCompactArrayShallowEqual(keyList, persistKeyList)) {
      __DEV__ && console.log('[save] save keyList:', keyList)
      setItem(keyListKey, keyList)
    }
    persistState = state
    persistKeyList = keyList
  }
  const load = () => { // get the whole state, so maybe load once on start
    try {
      const loadKeyList = getItem(keyListKey) || []
      persistState = loadKeyList.reduce((o, key) => {
        o[ key ] = getItem(key)
        return o
      }, {})
      persistKeyList = loadKeyList // NOTE: set after load state success
      __DEV__ && console.log('[load] persistState:', persistState)
    } catch (error) { __DEV__ && console.log('[load] error:', error) }
    return persistState
  }

  return {
    save,
    load
  }
}

export { createLocalStorageStateStore }
