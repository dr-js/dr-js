import { gzip, gzipSync, createGzip } from 'zlib'
import { promisify } from 'util'
import { DEFAULT_MIME, BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { writeBufferToStreamAsync, quickRunletFromStream } from 'source/node/data/Stream'
import { getEntityTagByContentHash } from 'source/node/module/EntityTag'

const gzipAsync = promisify(gzip)

// TODO: check timeout for responderSend?

const checkPair = (store, entityTag, isEnableGzip = false) => {
  entityTag && store.response.setHeader('etag', entityTag)
  const headers = store.request.headers
  const shouldSend = !entityTag || !(headers[ 'if-none-match' ] || '').includes(entityTag) // shouldSendContent
  const shouldGzip = isEnableGzip && shouldSend && (headers[ 'accept-encoding' ] || '').includes('gzip')
  return [ shouldSend, shouldGzip ]
}

const responseHead = (
  store, type, length, // length may be missing for stream, and '*' for range
  [ shouldSend, shouldGzip ], // from checkPair
  range // [ start, end ], range, will always send and disable gzip
) => {
  let statusCode = 200
  const headers = { 'content-type': type }
  if (length >= 0) headers[ 'content-length' ] = length // set number only

  // 1 of 3 choices
  if (range) {
    const [ start, end ] = range
    statusCode = 206
    headers[ 'content-length' ] = end - start + 1 // reset to range
    headers[ 'content-range' ] = `bytes ${start}-${end}/${length}`
    shouldSend = true
    // shouldGzip = false // no "gzip+range" combo, check: https://stackoverflow.com/questions/33947562/is-it-possible-to-send-http-response-using-gzip-and-byte-ranges-at-the-same-time
  } else if (!shouldSend) statusCode = 304
  else if (shouldGzip) headers[ 'content-encoding' ] = 'gzip'

  // console.log('[responseHead]', { statusCode, headers })
  store.response.writeHead(statusCode, headers)
  return shouldSend
}

const responderSendBuffer = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }) =>
  responseHead(store, type, length, checkPair(store, entityTag)) &&
  writeBufferToStreamAsync(store.response, buffer)

const responderSendBufferRange = (store, { buffer, entityTag, type = DEFAULT_MIME, length = buffer.length }, [ start, end ]) => {
  end = Math.min(end, length - 1) // fix range
  return responseHead(store, type, length, checkPair(store, entityTag), [ start, end ]) &&
    writeBufferToStreamAsync(store.response, buffer.slice(start, end + 1))
}

const responderSendBufferCompress = async (store, { buffer, bufferGzip, entityTag, type = DEFAULT_MIME, length = buffer.length }) => {
  const [ shouldSend, shouldGzip ] = checkPair(store, entityTag, true)
  if (shouldGzip) {
    buffer = bufferGzip || await gzipAsync(buffer)
    length = buffer.length
  }
  return responseHead(store, type, length, [ shouldSend, shouldGzip ]) &&
    writeBufferToStreamAsync(store.response, buffer)
}

const responderSendStream = (store, { stream, entityTag, type = DEFAULT_MIME, length }) =>
  responseHead(store, type, length, checkPair(store, entityTag)) &&
  quickRunletFromStream(stream, store.response)

const responderSendStreamRange = (store, { streamRange, entityTag, type = DEFAULT_MIME, length = '*' }, [ start, end ]) => {
  if (length >= 0) end = Math.min(end, length - 1) // fix range when length is known
  return responseHead(store, type, length, checkPair(store, entityTag), [ start, end ]) &&
    quickRunletFromStream(streamRange, store.response)
}

const responderSendStreamCompress = async (store, { stream, streamGzip, entityTag, type = DEFAULT_MIME, length }) => {
  const [ shouldSend, shouldGzip ] = checkPair(store, entityTag, true)
  return responseHead(store, type, shouldGzip ? undefined : length, [ shouldSend, shouldGzip ]) &&
    quickRunletFromStream.apply(null, !shouldGzip ? [ stream, store.response ]
      : streamGzip ? [ streamGzip, store.response ]
        : [ stream, createGzip(), store.response ]
    )
}

const responderSendJSON = (store, { object, entityTag }) => responderSendBufferCompress(store, {
  buffer: Buffer.from(JSON.stringify(object)),
  type: BASIC_EXTENSION_MAP.json,
  entityTag
})

const prepareBufferData = (buffer, type) => ({
  buffer, type,
  bufferGzip: gzipSync(buffer),
  entityTag: getEntityTagByContentHash(buffer)
})

const createResponderFavicon = (
  buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMXvf/PwAGnQMR4CJUOAAAAABJRU5ErkJggg==', 'base64'), // png 1px #63aeff
  type = BASIC_EXTENSION_MAP.png
) => (store) => responderSendBufferCompress(store, prepareBufferData(buffer, type))

const prepareBufferDataAsync = async (buffer, type) => prepareBufferData(buffer, type) // TODO: DEPRECATE: just use the sync version, this will not be more efficient as the buffer should already be in memory

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

  prepareBufferDataAsync // TODO: DEPRECATE
}
