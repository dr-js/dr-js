import { SCHEMA_MARK, isSchemaObject, toStructJSONWithCheck, getActionReducer, getReducer } from './function'

const objectMap = (object, mapFunc, result = {}) => Object.entries(object).reduce((o, [ key, value ]) => {
  o[ key ] = mapFunc(value, key)
  return o
}, result)

const setAssign = (set, assignSet) => {
  assignSet.forEach((v) => { if (set.has(v)) throw new Error(`[setAssign] duplicate key: ${v}`) })
  assignSet.forEach((v) => { set.add(v) })
  return set
}

const parseObjectStruct = ({ name, struct }) => {
  const initialState = {}
  const acceptNameSet = new Set([ name ])
  const schemaKeyList = []
  Object.entries(struct).forEach(([ key, value ]) => {
    if (isSchemaObject(value)) {
      initialState[ key ] = value.initialState
      setAssign(acceptNameSet, value.acceptNameSet)
      schemaKeyList.push(key)
    } else initialState[ key ] = value
  })
  return { initialState, acceptNameSet, schemaKeyList }
}

const getObjectStructReducer = ({ schemaKeyList, struct }) => (state, action) => {
  let hasChanged = false
  const nextState = {}
  for (let index = 0, indexMax = schemaKeyList.length; index < indexMax; index++) {
    const key = schemaKeyList[ index ]
    const prevKeyState = state[ key ]
    const nextKeyState = struct[ key ].reducer(prevKeyState, action)
    nextState[ key ] = nextKeyState
    hasChanged = hasChanged || nextKeyState !== prevKeyState
  }
  return hasChanged ? { ...state, ...nextState } : state
}

const createObjectSchema = ({ name, struct, actMap }) => {
  const { initialState, acceptNameSet, schemaKeyList } = parseObjectStruct({ name, struct })
  const structReducer = getObjectStructReducer({ schemaKeyList, struct })
  const actionReducer = getActionReducer({ actMap })
  const reducer = getReducer({ name, initialState, acceptNameSet, actionReducer, structReducer })
  const toStructJSON = () => objectMap(struct, toStructJSONWithCheck)
  return { SCHEMA_MARK, name, struct, initialState, acceptNameSet, reducer, toStructJSON }
}

export { createObjectSchema } // TODO: DEPRECATED: move out since not that essential
