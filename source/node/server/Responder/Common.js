import { URL } from 'url'
import { clock } from 'source/common/time'
import { time as formatTime } from 'source/common/format'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { sendBufferAsync } from 'source/node/data/Buffer'
import { pipeStreamAsync } from 'source/node/data/Stream'

const responderEnd = (store) => {
  if (store.response.finished) return store // NOTE: normally this should be it, the request is handled and response ended
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? 500 : 400)
  __DEV__ && error && store.response.write(`[ERROR] ${store.request.method}: ${store.request.url}\n${error.message}\n${error.stack}`)
  __DEV__ && error && console.error(`[ERROR] ${store.request.method}: ${store.request.url}\n`, error)
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

const responderSendBuffer = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }) => setResponseContent(store, entityTag, type, length) &&
  length && sendBufferAsync(store.response, buffer)
const responderSendBufferRange = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }, [ start, end ]) => setResponseContent(store, entityTag, type, length, start, end) &&
  length && sendBufferAsync(store.response, buffer.slice(start, end + 1))

const responderSendStream = (store, { stream, entityTag, type = DEFAULT_MIME, length }) => setResponseContent(store, entityTag, type, length) &&
  length && pipeStreamAsync(store.response, stream)
const responderSendStreamRange = (store, { stream, entityTag, type = DEFAULT_MIME, length }, [ start, end ]) => setResponseContentRange(store, entityTag, type, length, start, end) &&
  length && pipeStreamAsync(store.response, stream)

const responderSendJSON = (store, { object, entityTag }) => responderSendBuffer(store, { buffer: Buffer.from(JSON.stringify(object)), type: BASIC_EXTENSION_MAP.json, entityTag })

const setResponseContent = (store, entityTag, type, length) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  shouldSendContent
    ? store.response.writeHead(200, { 'content-type': type, 'content-length': length })
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent
}
const setResponseContentRange = (store, entityTag, type, length, start, end) => {
  entityTag && store.response.setHeader('etag', entityTag)
  store.response.writeHead(206, { 'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${length}` })
  return true
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
  : (store) => {
    store.response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload')
  }

export {
  responderEnd,
  responderEndWithStatusCode,
  responderEndWithRedirect,

  responderSendBuffer,
  responderSendBufferRange,
  responderSendStream,
  responderSendStreamRange,
  responderSendJSON,

  createResponderParseURL,
  createResponderLog,
  createResponderLogEnd,
  createResponderSetHeaderHSTS
}
