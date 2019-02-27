import { gzip, gzipSync, createGzip } from 'zlib'
import { promisify } from 'util'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { sendBufferAsync } from 'source/node/data/Buffer'
import { pipeStreamAsync } from 'source/node/data/Stream'
import { getEntityTagByContentHashAsync, getEntityTagByContentHash } from 'source/node/module/EntityTag'

const gzipAsync = promisify(gzip)

// TODO: check timeout for responderSend?

const setResponseContent = (store, entityTag, type, length) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  shouldSendContent
    ? store.response.writeHead(200, length ? { 'content-type': type, 'content-length': length } : { 'content-type': type })
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent
}

const setResponseContentRange = (store, entityTag, type, length = '*', start, end) => {
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
  pipeStreamAsync(store.response, stream)

const responderSendStreamRange = (store, { streamRange, entityTag, type = DEFAULT_MIME, length }, [ start, end ]) =>
  setResponseContentRange(store, entityTag, type, length, start, end) &&
  pipeStreamAsync(store.response, streamRange)

const responderSendStreamCompress = async (store, { stream, streamGzip, entityTag, type = DEFAULT_MIME, length }) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const shouldSendContent = !entityTag || !store.request.headers[ 'if-none-match' ] || !store.request.headers[ 'if-none-match' ].includes(entityTag)
  const shouldGzip = shouldSendContent && length && store.request.headers[ 'accept-encoding' ] && store.request.headers[ 'accept-encoding' ].includes('gzip')
  shouldSendContent
    ? store.response.writeHead(200, (shouldGzip
      ? { 'content-type': type, 'content-encoding': 'gzip' } // no length, will be: `Transfer-Encoding: chunked`, check `chunkedEncoding` in: https://github.com/nodejs/node/blob/master/lib/_http_outgoing.js
      : { 'content-type': type, 'content-length': length }
    ))
    : store.response.writeHead(304, { 'content-type': type })
  return shouldSendContent && length && pipeStreamAsync(store.response, shouldGzip ? (streamGzip || stream.pipe(createGzip())) : stream)
}

const responderSendJSON = (store, { object, entityTag }) => responderSendBufferCompress(store, {
  buffer: Buffer.from(JSON.stringify(object)),
  type: BASIC_EXTENSION_MAP.json,
  entityTag
})

const prepareBufferData = (buffer, type) => ({
  type,
  buffer,
  bufferGzip: gzipSync(buffer),
  entityTag: getEntityTagByContentHash(buffer),
  length: buffer.length
})

const prepareBufferDataAsync = async (buffer, type) => ({
  type,
  buffer,
  bufferGzip: await gzipAsync(buffer),
  entityTag: await getEntityTagByContentHashAsync(buffer),
  length: buffer.length
})

const createResponderFavicon = () => {
  const bufferData = prepareBufferData(
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMXvf/PwAGnQMR4CJUOAAAAABJRU5ErkJggg==', 'base64'), // 1px png #63aeff
    BASIC_EXTENSION_MAP.png
  )
  return (store) => responderSendBufferCompress(store, bufferData)
}

export {
  responderSendBuffer,
  responderSendBufferRange,
  responderSendBufferCompress,

  responderSendStream,
  responderSendStreamRange,
  responderSendStreamCompress,

  responderSendJSON,

  createResponderFavicon,

  prepareBufferData,
  prepareBufferDataAsync
}
