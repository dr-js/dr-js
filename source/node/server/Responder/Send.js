import { gzip, createGzip } from 'zlib'
import { promisify } from 'util'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { sendBufferAsync } from 'source/node/data/Buffer'
import { pipeStreamAsync } from 'source/node/data/Stream'

const gzipAsync = promisify(gzip)

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

const responderSendBuffer = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }) =>
  setResponseContent(store, entityTag, type, length) &&
  length &&
  sendBufferAsync(store.response, buffer)

const responderSendBufferRange = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }, [ start, end ]) =>
  setResponseContentRange(store, entityTag, type, length, start, end) &&
  length &&
  sendBufferAsync(store.response, buffer.slice(start, end + 1))

const responderSendBufferCompress = async (store, { buffer, bufferGzip, entityTag, type = DEFAULT_MIME, length = buffer.length }) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  const shouldGzip = shouldSendContent && length && store.request.headers[ 'accept-encoding' ] && store.request.headers[ 'accept-encoding' ].includes('gzip')
  const sendBuffer = shouldGzip ? (bufferGzip || await gzipAsync(buffer)) : buffer
  shouldSendContent
    ? store.response.writeHead(200, (shouldGzip
      ? { 'content-type': type, 'content-length': sendBuffer.length, 'content-encoding': 'gzip' }
      : { 'content-type': type, 'content-length': length }
    ))
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent && length && sendBufferAsync(store.response, sendBuffer)
}

const responderSendStream = (store, { stream, entityTag, type = DEFAULT_MIME, length }) =>
  setResponseContent(store, entityTag, type, length) &&
  length &&
  pipeStreamAsync(store.response, stream)

const responderSendStreamRange = (store, { streamRange, entityTag, type = DEFAULT_MIME, length }, [ start, end ]) =>
  setResponseContentRange(store, entityTag, type, length, start, end) &&
  length &&
  pipeStreamAsync(store.response, streamRange)

const responderSendStreamCompress = async (store, { stream, streamGzip, entityTag, type = DEFAULT_MIME, length }) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  const shouldGzip = shouldSendContent && length && store.request.headers[ 'accept-encoding' ] && store.request.headers[ 'accept-encoding' ].includes('gzip')
  shouldSendContent
    ? store.response.writeHead(200, (shouldGzip
      ? { 'content-type': type, 'transfer-encoding': 'gzip', 'content-encoding': 'gzip' }
      : { 'content-type': type, 'content-length': length }
    ))
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent && length && pipeStreamAsync(store.response, shouldGzip ? (streamGzip || stream.pipe(createGzip())) : stream)
}

const responderSendJSON = (store, { object, entityTag }) => responderSendBuffer(store, {
  buffer: Buffer.from(JSON.stringify(object)),
  type: BASIC_EXTENSION_MAP.json,
  entityTag
})

export {
  responderSendBuffer,
  responderSendBufferRange,
  responderSendBufferCompress,

  responderSendStream,
  responderSendStreamRange,
  responderSendStreamCompress,

  responderSendJSON
}
