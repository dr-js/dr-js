import { URL } from 'url'
import { clock } from 'source/common/time'
import { time as formatTime } from 'source/common/format'

const responderEnd = (store) => {
  if (store.response.finished) return store // NOTE: normally this should be it, the request is handled and response ended
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? 500 : 400)
  __DEV__ && error && store.response.write(`[ERROR] ${describeRequest(store.request)}\n${error.stack || error}`)
  __DEV__ && error && console.error(`[ERROR] ${describeRequest(store.request)}\n`, error)
  store.response.end() // force end the response to prevent pending
}

const responderEndWithStatusCode = (store, { statusCode = 500, headerMap }) => {
  if (store.response.finished) return store
  !store.response.headersSent && store.response.writeHead(statusCode, headerMap)
  store.response.end()
}

const responderEndWithRedirect = (store, { statusCode = 302, redirectUrl }) => {
  if (store.response.finished) return store
  !store.response.headersSent && store.response.writeHead(statusCode, { 'location': redirectUrl })
  store.response.end()
}

const createResponderParseURL = ({ baseUrl = '', baseUrlObject = new URL(baseUrl) }) => (store) => {
  const { url: urlString, method } = store.request
  store.setState({ url: new URL(urlString, baseUrlObject), method })
}

const createResponderLog = (log) => (store) => {
  log(
    describeRequest(store.request),
    '|',
    store.request.headers[ 'user-agent' ] || 'no-user-agent'
  )
}

const createResponderLogEnd = (log) => (store) => {
  const { time, error } = store.getState()
  __DEV__ && error && console.error(describeRequest(store.request), error)
  log(
    describeRequest(store.request),
    '|',
    error ? '[ERROR]' : '[END]',
    formatTime(clock() - time),
    store.response.statusCode,
    error ? error.stack || error : ''
  )
}

const describeRequest = ({
  url, method, headers: { host = '' }, socket: { remoteAddress, remotePort }
}) => `[${method}] ${host}${url} (${remoteAddress}:${remotePort})`

const createResponderSetHeaderHSTS = (protocol) => protocol !== 'https:'
  ? () => {}
  : (store) => { store.response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload') }

export {
  responderEnd,
  responderEndWithStatusCode,
  responderEndWithRedirect,

  createResponderParseURL,
  createResponderLog,
  createResponderLogEnd,
  createResponderSetHeaderHSTS
}
