import { strictEqual, deepStrictEqual, notStrictEqual, notDeepStrictEqual, throws, doesNotThrow } from 'assert'
import { objectMerge } from './Object'
import { createInsideOutPromise } from 'source/common/function'
import { createStateStore, createStateStoreEnhanced, createStateStoreLite } from './StateStore'

const { describe, it } = global

const verifyBasicStateGetSet = (store, initialState) => {
  strictEqual(typeof (store.getState), 'function')
  strictEqual(typeof (store.setState), 'function')
  strictEqual(typeof (store.getState()), 'object')
  deepStrictEqual(store.setState({}), store.getState())

  deepStrictEqual(store.setState({}), initialState)
  deepStrictEqual(store.setState({ key1: 'value1' }), initialState)
  deepStrictEqual(store.setState(initialState), initialState)
  deepStrictEqual(store.setState({}), store.getState())

  const alteredState = store.setState({ test: 'value' })
  notStrictEqual(alteredState, initialState)
  notStrictEqual(store.setState({}), initialState)
  notStrictEqual(store.setState(initialState), initialState)
  deepStrictEqual(store.setState({}), store.getState())
  deepStrictEqual(store.setState({}), alteredState)
  deepStrictEqual(store.setState(initialState), alteredState)
}

const verifyBasicSubscribeUnsubscribe = (store) => {
  strictEqual(typeof (store.subscribe), 'function')
  strictEqual(typeof (store.unsubscribe), 'function')

  const listener = (state, prevState) => {
    notDeepStrictEqual(state, prevState)
    callCount++
  }
  const listenerAlter = (state, prevState) => {
    notDeepStrictEqual(state, prevState)
    callCount++
  }
  let callCount = 0

  store.subscribe(listener)

  callCount = 0
  store.setState({})
  strictEqual(callCount, 0)

  callCount = 0
  store.setState({ key1: 'value1' })
  strictEqual(callCount, 0)

  callCount = 0
  store.setState({ add: 'valueNew' })
  strictEqual(callCount, 1)
  store.setState({ add: 'valueNew' }) // not change second time
  strictEqual(callCount, 1)

  store.subscribe(listener) // same will deduplicate

  callCount = 0
  store.setState({ add1: 'valueNew1' })
  strictEqual(callCount, 1)

  store.subscribe(listenerAlter) // 2 listener

  callCount = 0
  store.setState({ add2: 'valueNew2' })
  strictEqual(callCount, 2)

  store.unsubscribe(listenerAlter) // 1 listener

  callCount = 0
  store.setState({ add3: 'valueNew3' })
  strictEqual(callCount, 1)

  store.unsubscribe(listener) // 0 listener

  callCount = 0
  store.setState({ add4: 'valueNew4' })
  strictEqual(callCount, 0)
}

const INITIAL_STATE = { key1: 'value1', sub: { key2: 'value2' } }

const ENHANCER = (enhancerStore, action) => {
  // do nothing
}
const REDUCER = (state, { type, payload }) => payload ? objectMerge(state, payload) : state
const ACTION = { type: '', payload: {} }

describe('Common.Immutable.StateStore', () => {
  describe('createStateStore()', () => {
    it('should check arguments', () => {
      throws(() => createStateStore())
      throws(() => createStateStore(null))
      throws(() => createStateStore(undefined))
      throws(() => createStateStore(() => {}))
      throws(() => createStateStore([]))
      throws(() => createStateStore(0))
      throws(() => createStateStore('string'))
      doesNotThrow(() => createStateStore(INITIAL_STATE))
    })

    it('should pass verifyBasicStateGetSet', () => {
      verifyBasicStateGetSet(createStateStore(INITIAL_STATE), INITIAL_STATE)
    })

    it('should pass verifyBasicSubscribeUnsubscribe', () => {
      verifyBasicSubscribeUnsubscribe(createStateStore(INITIAL_STATE))
    })
  })

  describe('createStateStoreLite()', () => {
    it('should pass verifyBasicStateGetSet', () => {
      verifyBasicStateGetSet(createStateStoreLite(INITIAL_STATE), INITIAL_STATE)
    })
  })

  describe('createStateStoreEnhanced()', () => {
    it('should check arguments', () => {
      throws(() => createStateStoreEnhanced())
      throws(() => createStateStoreEnhanced(null))
      throws(() => createStateStoreEnhanced(undefined))
      throws(() => createStateStoreEnhanced({}))
      throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE }))
      throws(() => createStateStoreEnhanced({ enhancer: ENHANCER }))
      throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, reducer: REDUCER }))
      throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: null, reducer: null }))
      throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: {}, reducer: {} }))
      throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: {}, reducer: REDUCER }))
      doesNotThrow(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: REDUCER }))
    })

    it('should pass verifyBasicSubscribeUnsubscribe', () => {
      const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: REDUCER })

      // patch setState for test
      store.setState = (state) => {
        store.dispatch({ type: 'update', payload: state })
        return store.getState()
      }

      verifyBasicSubscribeUnsubscribe(store)
    })

    it('should pass basic dispatch', () => {
      const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: {} })
      strictEqual(callCount, 0)
      deepStrictEqual(store.getState(), INITIAL_STATE)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { new: 'value' } })
      strictEqual(callCount, 1)
      notStrictEqual(store.getState(), INITIAL_STATE)
    })

    it('should pass sub dispatch', () => {
      const enhancer = (enhancerStore, { type, payload: { count } }) => {
        strictEqual(store.getState().count, 10) // not being reduced yet
        count++
        if (count < 10) enhancerStore.dispatch({ type, payload: { count, [ `v${count}` ]: `v${count}` } })
      }

      const store = createStateStoreEnhanced({ initialState: { count: 10 }, enhancer, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      store.dispatch({ type: 'trigger', payload: { count: 0 } })

      strictEqual(callCount, 1) // batched sub dispatch state
      deepStrictEqual(store.getState(), {
        v9: 'v9',
        v8: 'v8',
        v7: 'v7',
        v6: 'v6',
        v5: 'v5',
        v4: 'v4',
        v3: 'v3',
        v2: 'v2',
        v1: 'v1',
        count: 0 // reducer will be called in reverse
      })
    })

    it('should pass basic reducer', () => {
      const reducer = (state, { type, payload: { set, add } }) => {
        if (Number.isInteger(set)) state = { value: set }
        if (Number.isInteger(add)) state = { value: state.value + add }
        return state
      }

      const store = createStateStoreEnhanced({ initialState: { value: 10 }, enhancer: ENHANCER, reducer })

      let callCount = 0
      const listener = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      deepStrictEqual(store.getState(), { value: 10 })
      strictEqual(callCount, 0)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { set: 0 } })
      deepStrictEqual(store.getState(), { value: 0 })
      strictEqual(callCount, 1)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { add: 5 } })
      deepStrictEqual(store.getState(), { value: 5 })
      strictEqual(callCount, 1)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { set: 20, add: 100 } })
      deepStrictEqual(store.getState(), { value: 120 })
      strictEqual(callCount, 1)
    })

    it('should pass check reducer', () => {
      throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => null })
        store.dispatch(ACTION)
      })

      throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => undefined })
        store.dispatch(ACTION)
      })

      throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => [] })
        store.dispatch(ACTION)
      })
    })

    it('should pass check dispatch in reducer', () => {
      throws(() => {
        const store = createStateStoreEnhanced({
          initialState: INITIAL_STATE,
          enhancer: ENHANCER,
          reducer: (state, action) => {
            store.dispatch(action)
            return state
          }
        })
        store.dispatch(ACTION)
      })
    })

    it('should pass async dispatch in enhancer', async () => {
      const { promise, resolve } = createInsideOutPromise()

      const enhancer = (enhancerStore, { type, payload: { count } }) => {
        count === 0 && setTimeout(() => {
          count = 1
          enhancerStore.dispatch({ type, payload: { count, [ `v${count}` ]: `v${count}` } })
          resolve()
        }, 50)
      }

      const store = createStateStoreEnhanced({ initialState: { count: 10 }, enhancer, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      strictEqual(callCount, 1)
      deepStrictEqual(store.getState(), { count: 0 })

      await promise
      strictEqual(callCount, 2)
      deepStrictEqual(store.getState(), { count: 1, v1: 'v1' })
    })

    it('should pass listener change in dispatch', () => {
      const store = createStateStoreEnhanced({ initialState: { count: 10 }, enhancer: ENHANCER, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        store.unsubscribe(listenerAlter)
        callCount++
      }
      const listenerAlter = (state, prevState) => {
        notDeepStrictEqual(state, prevState)
        store.unsubscribe(listener)
        callCount++
      }
      store.subscribe(listener)
      store.subscribe(listenerAlter)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      strictEqual(callCount, 2)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 5 } })
      strictEqual(callCount, 0)
    })
  })
})
