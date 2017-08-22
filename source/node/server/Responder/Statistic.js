import { clock } from 'source/common/time'

const createResponderLogRequestHeader = (doLog) => (store) => {
  const { url, method, headers, socket: { remoteAddress, remotePort } } = store.request
  const host = headers[ 'host' ] || ''
  const userAgent = headers[ 'user-agent' ] || ''
  doLog({ url, method, host, userAgent, remoteAddress, remotePort }, store.getState())
}

const createResponderLogTimeStep = (doLog) => (store) => {
  const state = store.getState()
  const stepTime = clock()
  doLog(stepTime - (state.stepTime || state.time), state)
  store.setState({ stepTime })
}

const createResponderLogEnd = (doLog) => (store) => {
  const state = store.getState()
  const { finished, statusCode } = store.response
  const duration = clock() - state.time
  doLog({ duration, finished, statusCode }, state)
}

export {
  createResponderLogRequestHeader,
  createResponderLogTimeStep,
  createResponderLogEnd
}
