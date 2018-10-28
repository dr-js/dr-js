import { URL } from 'url'
import { clock } from 'source/common/time'
import { time as formatTime } from 'source/common/format'

const responderEnd = (store) => {
  if (store.response.finished) return // NOTE: normally this should be it, the request is handled and response ended
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? 500 : 400)
  __DEV__ && error && store.response.write(`[ERROR] ${describeRequest(store.request)}\n${error.stack || error}`)
  __DEV__ && error && console.error(`[ERROR] ${describeRequest(store.request)}\n`, error)
  store.response.end() // force end the response to prevent pending
}

// TODO: add responderEndRandomErrorStatus?

const responderEndWithStatusCode = (store, { statusCode = 500, headerMap }) => {
  if (store.response.finished) return
  !store.response.headersSent && store.response.writeHead(statusCode, headerMap)
  store.response.end()
}

const responderEndWithRedirect = (store, { statusCode = 302, redirectUrl }) => {
  if (store.response.finished) return
  !store.response.headersSent && store.response.writeHead(statusCode, { 'location': redirectUrl })
  store.response.end()
}

const responderSetHeaderCacheControlImmutable = (store) => { store.response.setHeader('cache-control', 'max-age=315360000, public, immutable') }

// NOTE: normally just pass the server option here
const createResponderParseURL = ({ baseUrl = '', baseUrlObject = new URL(baseUrl) }) => (store) => {
  const { url: urlString, method } = store.request
  store.setState({ url: new URL(urlString, baseUrlObject), method })
}

// TODO: this just solves HTTP host map problem or HTTPS port map
//   for HTTPS host, use `addContext` to add more host cert config: https://nodejs.org/api/tls.html#tls_server_addcontext_hostname_context
//   also: https://stackoverflow.com/questions/25952255/serve-two-https-hostnames-from-single-node-process-port
const createResponderHostMapper = (hostMap, responderDefault) => (store) => {
  const { headers: { host } } = store.request
  const responder = hostMap[ host || '' ] || responderDefault
  return responder && responder(store)
}

const describeRequest = ({
  url, method, headers: { host = '' }, socket: { remoteAddress, remotePort }
}) => `[${method}] ${host}${url} (${remoteAddress}:${remotePort})`

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

const createResponderSetHeaderHSTS = (protocol) => protocol !== 'https:'
  ? () => {}
  : (store) => { store.response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload') }

export {
  responderEnd,
  responderEndWithStatusCode,
  responderEndWithRedirect,
  responderSetHeaderCacheControlImmutable,

  createResponderParseURL,
  createResponderHostMapper,
  createResponderLog,
  createResponderLogEnd,
  createResponderSetHeaderHSTS
}
