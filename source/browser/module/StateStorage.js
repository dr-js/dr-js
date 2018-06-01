import { isCompactArrayShallowEqual } from 'source/common/immutable/check'

const KEY_LIST_KEY = '@@KEY_LIST'

// sync
// immutable state
// split state save 1 level deeper (diff, may be faster)

const createSyncStateStorage = ({
  keyPrefix = 'STATE', // for multi storage setup
  setItem = (key, value) => window.localStorage.setItem(`${keyPrefix}|${key}`, JSON.stringify(value)),
  getItem = (key) => JSON.parse(window.localStorage.getItem(`${keyPrefix}|${key}`)),
  removeItem = (key) => window.localStorage.removeItem(`${keyPrefix}|${key}`)
}) => {
  let persistState = {}
  let persistKeyList = []

  const reset = (initialPersistState) => {
    persistState = {}
    save(initialPersistState)
    return persistState
  }
  const init = (initialState) => reset({
    ...initialState,
    ...load()
  })
  const save = (state) => {
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
      setItem(KEY_LIST_KEY, keyList)
    }
    persistState = state
    persistKeyList = keyList
  }
  const load = () => {
    try {
      const loadKeyList = getItem(KEY_LIST_KEY) || []
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
    reset, // will return result state
    init, // will return result state
    save,
    load
  }
}

export { createSyncStateStorage }
