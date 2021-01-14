import { clock } from 'source/common/time'
import { createStateStoreLite } from 'source/common/immutable/StateStore'

const DEFAULT_RESPONDER_ERROR = (store, error) => {
  store.webSocket.doCloseSocket(error)
  store.setState({ error })
}

const createUpdateRequestListener = ({
  responderList = [],
  responderError = DEFAULT_RESPONDER_ERROR
}) => async (webSocket, request, bodyHeadBuffer) => {
  __DEV__ && console.log(`[createUpdateRequestListener] ${request.method}: ${request.url}`)
  const stateStore = createStateStoreLite({
    time: clock(), // in msec
    error: null, // from failed responder, but will not be processed
    protocol: '' // should be set in responder, or the connection will be dropped
  })
  stateStore.request = request
  stateStore.response = { finished: true } // disabled, mock response
  stateStore.webSocket = webSocket
  stateStore.bodyHeadBuffer = bodyHeadBuffer
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { await responderError(stateStore, error) }
  return stateStore.getState().protocol
}

export { createUpdateRequestListener } // TODO: DEPRECATE: use `node/server/WS`
