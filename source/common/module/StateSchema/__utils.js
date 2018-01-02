const SCHEMA_MARK = '@@SCHEMA_MARK'

const isSchemaObject = (value) => (
  typeof (value) === 'object' &&
  value !== null &&
  value.SCHEMA_MARK === SCHEMA_MARK
)

const toStructJSONWithCheck = (value) => (value instanceof Object && 'toStructJSON' in value) ? value.toStructJSON() : value

const getActionReducer = ({ actMap }) => (state, { type, payload }) => {
  const actionReducer = actMap[ type ]
  return actionReducer
    ? actionReducer(state, payload) // processed
    : state // missed
}

const getReducer = ({ name, initialState, acceptNameSet, actionReducer, structReducer }) => {
  const baseReducer = (state, action) => (action.type !== undefined && action.name === name)
    ? actionReducer(state, action) // process accepted action here
    : structReducer(state, action) // pass action down, or array filter

  return (state = initialState, action) => {
    if (!acceptNameSet.has(action.name)) return state // filtered by accept name, (most case)
    if (action.batch !== undefined && action.name === name) return action.batch.reduce(baseReducer, state) // batched action
    return baseReducer(state, action) // single action
  }
}

export {
  SCHEMA_MARK,
  isSchemaObject,
  toStructJSONWithCheck,
  getActionReducer,
  getReducer
}
