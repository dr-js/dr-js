import { URL } from 'url'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module'
import { receiveBufferAsync, sendBufferAsync, pipeStreamAsync } from 'source/node/resource'

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
  length &&
  sendBufferAsync(store.response, buffer)

const responderSendStream = (store, { stream, entityTag, type = DEFAULT_MIME, length }) => setResponseContent(store, entityTag, type, length) &&
  length &&
  pipeStreamAsync(store.response, stream)

const responderSendJSON = (store, { object, entityTag }) => responderSendBuffer(store, { buffer: Buffer.from(JSON.stringify(object)), type: BASIC_EXTENSION_MAP.json, entityTag })

const setResponseContent = (store, entityTag, type, length) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  shouldSendContent
    ? store.response.writeHead(200, { 'content-type': type, 'content-length': length })
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent
}

const createResponderParseURL = ({ baseUrl = '', baseUrlObject = new URL(baseUrl) }) => (store) => {
  const { url: urlString, method } = store.request
  store.setState({ url: new URL(urlString, baseUrlObject), method })
}

const createResponderReceiveBuffer = (setBufferData = AccessorMap.bufferData.set) => async (store) => setBufferData(store, await receiveBufferAsync(store.request))

const createStoreStateAccessor = (key) => ({
  get: (store) => store.getState()[ key ],
  set: (store, value) => store.setState({ [key]: value })
})

const AccessorMap = {
  // error: createStoreStateAccessor('error'),
  // url: createStoreStateAccessor('url'),
  bufferData: createStoreStateAccessor('bufferData'), // { buffer, length, type, entityTag }
  streamData: createStoreStateAccessor('streamData'), // { stream, length, type, entityTag }
  JSONData: createStoreStateAccessor('JSONData') // { object, entityTag }
}

export {
  responderEnd,
  responderEndWithStatusCode,
  responderEndWithRedirect,

  responderSendBuffer,
  responderSendStream,
  responderSendJSON,

  createResponderParseURL,
  createResponderReceiveBuffer,

  createStoreStateAccessor,
  AccessorMap
}
