import nodeModuleAssert from 'assert'
import { objectMerge } from './ImmutableOperation'
import { createInsideOutPromise } from 'source/common/function'
import { createStateStore, createStateStoreEnhanced, createStateStoreLite } from './StateStore'

const { describe, it } = global

const verifyBasicStateGetSet = (store, initialState) => {
  nodeModuleAssert.equal(typeof (store.getState), 'function')
  nodeModuleAssert.equal(typeof (store.setState), 'function')
  nodeModuleAssert.equal(typeof (store.getState()), 'object')
  nodeModuleAssert.deepStrictEqual(store.setState({}), store.getState())

  nodeModuleAssert.deepStrictEqual(store.setState({}), initialState)
  nodeModuleAssert.deepStrictEqual(store.setState({ key1: 'value1' }), initialState)
  nodeModuleAssert.deepStrictEqual(store.setState(initialState), initialState)
  nodeModuleAssert.deepStrictEqual(store.setState({}), store.getState())

  const alteredState = store.setState({ test: 'value' })
  nodeModuleAssert.notEqual(alteredState, initialState)
  nodeModuleAssert.notEqual(store.setState({}), initialState)
  nodeModuleAssert.notEqual(store.setState(initialState), initialState)
  nodeModuleAssert.deepStrictEqual(store.setState({}), store.getState())
  nodeModuleAssert.deepStrictEqual(store.setState({}), alteredState)
  nodeModuleAssert.deepStrictEqual(store.setState(initialState), alteredState)
}

const verifyBasicSubscribeUnsubscribe = (store) => {
  nodeModuleAssert.equal(typeof (store.subscribe), 'function')
  nodeModuleAssert.equal(typeof (store.unsubscribe), 'function')

  const listener = (state, prevState) => {
    nodeModuleAssert.notStrictEqual(state, prevState)
    callCount++
  }
  const listenerAlter = (state, prevState) => {
    nodeModuleAssert.notStrictEqual(state, prevState)
    callCount++
  }
  let callCount = 0

  store.subscribe(listener)

  callCount = 0
  store.setState({})
  nodeModuleAssert.equal(callCount, 0)

  callCount = 0
  store.setState({ key1: 'value1' })
  nodeModuleAssert.equal(callCount, 0)

  callCount = 0
  store.setState({ add: 'valueNew' })
  nodeModuleAssert.equal(callCount, 1)
  store.setState({ add: 'valueNew' }) // not change second time
  nodeModuleAssert.equal(callCount, 1)

  store.subscribe(listener) // same will deduplicate

  callCount = 0
  store.setState({ add1: 'valueNew1' })
  nodeModuleAssert.equal(callCount, 1)

  store.subscribe(listenerAlter) // 2 listener

  callCount = 0
  store.setState({ add2: 'valueNew2' })
  nodeModuleAssert.equal(callCount, 2)

  store.unsubscribe(listenerAlter) // 1 listener

  callCount = 0
  store.setState({ add3: 'valueNew3' })
  nodeModuleAssert.equal(callCount, 1)

  store.unsubscribe(listener) // 0 listener

  callCount = 0
  store.setState({ add4: 'valueNew4' })
  nodeModuleAssert.equal(callCount, 0)
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
      nodeModuleAssert.throws(() => createStateStore())
      nodeModuleAssert.throws(() => createStateStore(null))
      nodeModuleAssert.throws(() => createStateStore(undefined))
      nodeModuleAssert.throws(() => createStateStore(() => {}))
      nodeModuleAssert.throws(() => createStateStore([]))
      nodeModuleAssert.throws(() => createStateStore(0))
      nodeModuleAssert.throws(() => createStateStore('string'))
      nodeModuleAssert.doesNotThrow(() => createStateStore(INITIAL_STATE))
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
      nodeModuleAssert.throws(() => createStateStoreEnhanced())
      nodeModuleAssert.throws(() => createStateStoreEnhanced(null))
      nodeModuleAssert.throws(() => createStateStoreEnhanced(undefined))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({}))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE }))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ enhancer: ENHANCER }))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, reducer: REDUCER }))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: null, reducer: null }))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: {}, reducer: {} }))
      nodeModuleAssert.throws(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: {}, reducer: REDUCER }))
      nodeModuleAssert.doesNotThrow(() => createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: REDUCER }))
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
        nodeModuleAssert.notStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: {} })
      nodeModuleAssert.equal(callCount, 0)
      nodeModuleAssert.deepStrictEqual(store.getState(), INITIAL_STATE)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { new: 'value' } })
      nodeModuleAssert.equal(callCount, 1)
      nodeModuleAssert.notEqual(store.getState(), INITIAL_STATE)
    })

    it('should pass sub dispatch', () => {
      const enhancer = (enhancerStore, { type, payload: { count } }) => {
        nodeModuleAssert.equal(store.getState().count, 10) // not being reduced yet
        count++
        if (count < 10) enhancerStore.dispatch({ type, payload: { count, [ `v${count}` ]: `v${count}` } })
      }

      const store = createStateStoreEnhanced({ initialState: { count: 10 }, enhancer, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        nodeModuleAssert.notStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      store.dispatch({ type: 'trigger', payload: { count: 0 } })

      nodeModuleAssert.equal(callCount, 1) // batched sub dispatch state
      nodeModuleAssert.deepEqual(store.getState(), {
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
        nodeModuleAssert.notStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      nodeModuleAssert.deepEqual(store.getState(), { value: 10 })
      nodeModuleAssert.equal(callCount, 0)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { set: 0 } })
      nodeModuleAssert.deepEqual(store.getState(), { value: 0 })
      nodeModuleAssert.equal(callCount, 1)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { add: 5 } })
      nodeModuleAssert.deepEqual(store.getState(), { value: 5 })
      nodeModuleAssert.equal(callCount, 1)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { set: 20, add: 100 } })
      nodeModuleAssert.deepEqual(store.getState(), { value: 120 })
      nodeModuleAssert.equal(callCount, 1)
    })

    it('should pass check reducer', () => {
      nodeModuleAssert.throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => null })
        store.dispatch(ACTION)
      })

      nodeModuleAssert.throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => undefined })
        store.dispatch(ACTION)
      })

      nodeModuleAssert.throws(() => {
        const store = createStateStoreEnhanced({ initialState: INITIAL_STATE, enhancer: ENHANCER, reducer: (state, action) => [] })
        store.dispatch(ACTION)
      })
    })

    it('should pass check dispatch in reducer', () => {
      nodeModuleAssert.throws(() => {
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
        nodeModuleAssert.notStrictEqual(state, prevState)
        callCount++
      }
      store.subscribe(listener)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      nodeModuleAssert.equal(callCount, 1)
      nodeModuleAssert.deepEqual(store.getState(), { count: 0 })

      await promise
      nodeModuleAssert.equal(callCount, 2)
      nodeModuleAssert.deepEqual(store.getState(), { count: 1, v1: 'v1' })
    })

    it('should pass listener change in dispatch', () => {
      const store = createStateStoreEnhanced({ initialState: { count: 10 }, enhancer: ENHANCER, reducer: REDUCER })

      let callCount = 0
      const listener = (state, prevState) => {
        nodeModuleAssert.notStrictEqual(state, prevState)
        store.unsubscribe(listenerAlter)
        callCount++
      }
      const listenerAlter = (state, prevState) => {
        nodeModuleAssert.notStrictEqual(state, prevState)
        store.unsubscribe(listener)
        callCount++
      }
      store.subscribe(listener)
      store.subscribe(listenerAlter)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 0 } })
      nodeModuleAssert.equal(callCount, 2)

      callCount = 0
      store.dispatch({ type: 'trigger', payload: { count: 5 } })
      nodeModuleAssert.equal(callCount, 0)
    })
  })
})
