import { URL } from 'url'
import { BASIC_EXTENSION_MAP } from 'source/common/module'
import { receiveBufferAsync, sendBufferAsync, pipeBufferAsync } from 'source/node/resource'

const responderEnd = (store) => {
  if (store.response.finished) return store // TODO: NOTE: normally this should be it, the request is handled and response ended
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? 500 : 400)
  __DEV__ && error && store.response.write(`[ERROR] ${store.request.method}: ${store.request.url}\n${error.message}\n${error.stack}`)
  __DEV__ && error && console.error(`[ERROR] ${store.request.method}: ${store.request.url}\n`, error)
  store.response.end() // force end the response to prevent pending
}

const createResponderParseURL = ({ baseUrl = '', baseUrlObject = new URL(baseUrl) }) => (store) => {
  const { url: urlString, method } = store.request
  store.setState({ url: new URL(urlString, baseUrlObject), method })
}

const createResponderReceiveBuffer = (setBuffer) => async (store) => setBuffer(store, await receiveBufferAsync(store.request))

const createResponderSendBuffer = (getBuffer) => async (store) => {
  const { buffer, length, type, entityTag } = await getBuffer(store)
  entityTag && store.response.setHeader('etag', entityTag)
  if (entityTag && verifyEntityTag(store.request.headers, entityTag)) return store.response.writeHead(304, { 'content-type': type })
  store.response.writeHead(200, { 'content-type': type, 'content-length': length })
  return length && sendBufferAsync(store.response, buffer)
}

const createResponderSendStream = (getStream) => async (store) => {
  const { stream, length, type, entityTag } = await getStream(store)
  entityTag && store.response.setHeader('etag', entityTag)
  if (entityTag && verifyEntityTag(store.request.headers, entityTag)) return store.response.writeHead(304, { 'content-type': type })
  store.response.writeHead(200, { 'content-type': type, 'content-length': length })
  return length && pipeBufferAsync(store.response, stream)
}

const createResponderSendJSON = (getJSON) => {
  const responderSendBuffer = createResponderSendBuffer((store) => store.getState().JSONBuffer)
  return async (store) => {
    const { object, entityTag } = await getJSON(store)
    const buffer = Buffer.from(JSON.stringify(object))
    store.setState({ JSONBuffer: { buffer, length: buffer.length, type: BASIC_EXTENSION_MAP.json, entityTag } })
    return responderSendBuffer(store)
  }
}

const verifyEntityTag = (headers, entityTag) => {
  const matchTag = headers[ 'if-none-match' ]
  return Boolean(matchTag && matchTag.includes(entityTag))
}

export {
  responderEnd,
  createResponderParseURL,
  createResponderReceiveBuffer,
  createResponderSendBuffer,
  createResponderSendStream,
  createResponderSendJSON
}
