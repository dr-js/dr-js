import { SCHEMA_MARK, isSchemaObject, toStructJSONWithCheck, getActionReducer, getReducer } from './function'

const DEFAULT_ARRAY_REDUCER = (state, action) => { throw new Error(`[DEFAULT_ARRAY_REDUCER] unexpected action: ${JSON.stringify(action)}`) }

const getArrayStructReducer = (schema) => (arrayState, action) => {
  let nextArrayState
  const reduceItem = (state, action, index) => { // payload as item-action
    const nextState = schema.reducer(state, action)
    if (state === nextState) return
    if (nextArrayState === undefined) nextArrayState = [ ...arrayState ]
    nextArrayState[ index ] = nextState
  }
  if (action.index !== undefined) reduceItem(arrayState[ action.index ], action.payload, action.index) // for specific single item
  else if (action.filter !== undefined) reduceWithArrayFilter(action, arrayState, reduceItem) // for every item
  return nextArrayState !== undefined ? nextArrayState : arrayState
}

const reduceWithArrayFilter = (action, arrayState, reduceItem) => { // TODO: add more filters
  switch (action.filter.type) {
    case 'key-value': {
      const { key, value } = action.filter
      arrayState.forEach((state, index) => (state[ key ] === value) && reduceItem(state, action.payload, index))
      break
    }
    default:
      throw new Error(`[getArrayFilter] unsupported filter: ${JSON.stringify(action.filter)}`)
  }
}

const createArraySchema = ({ name, struct, actMap }) => {
  const initialState = []
  const acceptNameSet = new Set([ name ])
  const structReducer = isSchemaObject(struct[ 0 ]) ? getArrayStructReducer(struct[ 0 ]) : DEFAULT_ARRAY_REDUCER
  const actionReducer = getActionReducer({ actMap })
  const reducer = getReducer({ name, initialState, acceptNameSet, actionReducer, structReducer })
  const toStructJSON = () => struct.map(toStructJSONWithCheck)
  return { SCHEMA_MARK, name, struct, initialState, acceptNameSet, reducer, toStructJSON }
}

export { createArraySchema }
