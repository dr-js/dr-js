import { clock } from 'source/common/time'
import { createStateStoreLite } from 'source/common/immutable/StateStore'

const GET_INITIAL_STORE_STATE = () => ({
  error: null, // from failed responder, but will not be processed
  time: clock(), // in msec
  url: null, // from createResponderParseURL
  method: null, // from createResponderParseURL
  protocol: ''
})

const DEFAULT_RESPONSE_REDUCER_LIST = []
const DEFAULT_RESPONSE_REDUCER_ERROR = (store, error) => {
  store.webSocket.doCloseSocket(error)
  store.setState({ error })
}

const createUpdateRequestListener = ({
  responderList = DEFAULT_RESPONSE_REDUCER_LIST,
  responderError = DEFAULT_RESPONSE_REDUCER_ERROR
}) => async (webSocket, request, bodyHeadBuffer) => {
  __DEV__ && console.log(`[createUpdateRequestListener] ${request.method}: ${request.url}`)
  const stateStore = createStateStoreLite(GET_INITIAL_STORE_STATE())
  stateStore.request = request
  stateStore.response = { finished: true } // disabled response
  stateStore.webSocket = webSocket
  stateStore.bodyHeadBuffer = bodyHeadBuffer
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { responderError(stateStore, error) }
  return stateStore.getState().protocol
}

export { createUpdateRequestListener }
