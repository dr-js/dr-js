import { clock } from 'source/common/time.js'

// TODO: add responderEndRandomErrorStatus?
const responderError = (store, error) => { store.setState({ error }) }

const responderEnd = (store) => {
  if (store.response.writableEnded) return // NOTE: normally this should be it, the request is handled and response ended
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? (error.status || 400) : 500)
  store.response.end() // force end the response to prevent pending
}

const responderEndWithStatusCode = (store, { statusCode = 500, headerMap, data }) => {
  if (store.response.finished) return
  !store.response.headersSent && store.response.writeHead(statusCode, headerMap)
  store.response.end(data)
}

const responderEndWithRedirect = (store, { statusCode = 302, redirectUrl }) => {
  if (store.response.finished) return
  !store.response.headersSent && store.response.writeHead(statusCode, { 'location': redirectUrl })
  store.response.end()
}

const responderSetHeaderCacheControlImmutable = (store) => { store.response.setHeader('cache-control', 'max-age=315360000, public, immutable') }

const DEFAULT_DESCRIBE_REQUEST = ({
  url, method, headers: { host }, socket: { remoteAddress, remotePort }
}) => `[${method}] ${host || ''}${url} (${remoteAddress}:${remotePort})`

const createResponderLog = ({
  loggerExot,
  log = loggerExot && loggerExot.add,
  describeRequest = DEFAULT_DESCRIBE_REQUEST
}) => (store) => {
  const userAgentString = store.request.headers[ 'user-agent' ] || 'none'
  log(
    describeRequest(store.request),
    '[UA]', userAgentString
  )
}

const createResponderLogEnd = ({
  loggerExot,
  log = loggerExot && loggerExot.add,
  describeRequest = DEFAULT_DESCRIBE_REQUEST
}) => (store) => {
  const { statusCode } = store.response
  const { time, error } = store.getState()
  const timeString = `${Math.round(clock() - time)}ms`
  log(
    describeRequest(store.request),
    error
      ? `[ERROR|${statusCode}|${timeString}] ${error.stack || error}`
      : `[END|${statusCode}|${timeString}]`
  )
}

const createResponderSetHeaderHSTS = ({ protocol }) => protocol !== 'https:'
  ? () => {}
  : (store) => { store.response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload') }

// TODO: this just solves HTTP host map problem or HTTPS port map, for multi HTTPS host server, check `SNICallback`:
//   https://en.wikipedia.org/wiki/Server_Name_Indication
//   https://github.com/nodejs/node/issues/17567
const createResponderHostMapper = ({
  hostResponderMap, // { [host]: responder }
  responderDefault // for last fallback
}) => (store) => {
  const responder = hostResponderMap[ (store.request.headers[ 'host' ] || '').toLowerCase() ] || responderDefault
  return responder && responder(store)
}

export {
  responderError,

  responderEnd,
  responderEndWithStatusCode,
  responderEndWithRedirect,
  responderSetHeaderCacheControlImmutable,

  createResponderLog,
  createResponderLogEnd,
  createResponderSetHeaderHSTS,
  createResponderHostMapper
}
