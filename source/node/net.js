import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { createGunzip } from 'zlib'

import { clock } from 'source/common/time'
import { isString } from 'source/common/check'
import { withRetryAsync } from 'source/common/function'
import { toArrayBuffer } from 'source/node/data/Buffer'
import { isReadableStream, setupStreamPipe, readableStreamToBufferAsync } from 'source/node/data/Stream'

const requestHttp = (
  url, // URL/String
  option, // { method, headers, timeout, agent, ... }
  body // optional, Buffer/String/ReadableStream
) => {
  url = url instanceof URL ? url : new URL(url)
  let request
  const promise = new Promise((resolve, reject) => {
    request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, option, resolve)
    const endWithError = (error) => {
      request.abort()
      reject(error)
    }
    request.on('timeout', () => endWithError(new Error('NETWORK_TIMEOUT')))
    request.on('error', endWithError)
    if (isReadableStream(body)) setupStreamPipe(body, request)
    else request.end(body)
  })
  return { url, request, promise }
}

// ping with a status code of 500 is still a successful ping
const ping = async (url, {
  method = 'GET',
  headers,
  body,
  wait = 5 * 1000,
  maxRetry = 0
} = {}) => withRetryAsync(
  async () => { // will result in error if timeout
    const response = await requestHttp(url, { method, headers, timeout: wait }, body).promise
    response.destroy() // skip response data
  },
  maxRetry,
  wait
)

// TODO: native fetch do not use timeout but AsyncController
// NOTE:
//   currently should call one of `buffer, text, json` to receive data.
//   These method can only be called once.
//   If not, on nextTick, the data will be dropped.
const fetchLikeRequest = async (url, {
  method = 'GET', // TODO: NOTE: in node, `GET|DELETE` method will implicitly skip body, add `content-length` to force send body
  headers: requestHeaders,
  body,
  bodyLength, // used as `total` for `onProgressUpload`, if not provided, and body is stream, the total will be set to `Infinity`
  timeout = 10 * 1000, // in millisecond, 0 for no timeout, will result in error if timeout
  onProgressUpload, // (now, total) => {} // if can't decide total will be `Infinity`
  onProgressDownload // (now, total) => {} // if can't decide total will be `Infinity`
} = {}) => {
  const option = {
    method,
    headers: { 'accept-encoding': 'gzip', ...requestHeaders },
    timeout
  }
  __DEV__ && console.log('[fetch]', option)
  const { request, promise } = requestHttp(url, option, body)
  const timeStart = clock()
  onProgressUpload && request.once('socket', (socket) => { // https://github.com/nodejs/help/issues/602
    bodyLength = bodyLength || (isReadableStream(body) ? Infinity
      : isString(body) ? Buffer.byteLength(body)
        : body.length)
    const bytesWrittenStart = socket.bytesWritten // may contain HTTP header, so may be bigger than the bodyLength
    const onProgress = () => { onProgressUpload(Math.min(socket.bytesWritten - bytesWrittenStart, bodyLength), bodyLength) }
    socket.on('drain', onProgress)
    const clearListener = () => socket.off('drain', onProgress)
    promise.then(clearListener, clearListener)
  })
  const response = await promise
  const status = response.statusCode
  return {
    status,
    ok: (status >= 200 && status < 300),
    headers: response.headers,
    ...wrapPayload(request, response, timeout + timeStart - clock(), onProgressDownload) // cut off connection setup time
  }
}

// TODO: NODE-BUG: delay pipe IncomingMessage to next event loop or the `end` even will not fire
//   node 6 IncomingMessage events fix
//     - https://github.com/mscdex/busboy/pull/134
//   http: IncomingMessage not emitting 'end'
//     - https://github.com/nodejs/node/issues/10344

const wrapPayload = (request, response, timeoutPayload, onProgressDownload) => {
  let payloadOutcome // KEEP|DROP
  process.nextTick(() => {
    if (payloadOutcome) return
    __DEV__ && console.log('[fetch] payload dropped')
    payloadOutcome = 'DROP'
    request.abort() // drop request
  })
  const stream = () => { // TODO: also use async?
    if (payloadOutcome) throw new Error(payloadOutcome === 'KEEP' ? 'PAYLOAD_ALREADY_USED' : 'PAYLOAD_ALREADY_DROPPED')
    __DEV__ && console.log('[fetch] keep payload')
    payloadOutcome = 'KEEP'
    if (timeoutPayload > 0) {
      const timeoutToken = setTimeout(() => {
        __DEV__ && console.log('[fetch] payload timeout', timeoutPayload)
        response.emit('error', new Error('PAYLOAD_TIMEOUT')) // TODO: NOTE: emit custom `error` event to signal stream stop
        request.abort() // drop request
      }, timeoutPayload)
      // request.off('timeout', func) // TODO: NOTE: timeoutPayload should be faster than the underlying socket timeout
      response.on('end', () => clearTimeout(timeoutToken))
    }
    if (onProgressDownload) {
      const payloadLength = Number(response.headers[ 'content-length' ]) || Infinity
      let chunkLength = 0
      const onProgress = (chunk) => {
        chunkLength += chunk.length
        onProgressDownload(chunkLength, payloadLength)
      }
      response.socket.on('data', onProgress)
      const clearListener = () => response.socket.off('data', onProgress)
      response.on('error', clearListener)
      response.on('end', clearListener)
    }
    return response.headers[ 'content-encoding' ] === 'gzip'
      ? setupStreamPipe(response, createGunzip())
      : response
  }
  const buffer = async () => readableStreamToBufferAsync(stream()) // use async to keep error inside promise
  const arrayBuffer = () => buffer().then(toArrayBuffer)
  const text = () => buffer().then(toText)
  const json = () => text().then(parseJSON)
  return { stream, buffer, arrayBuffer, text, json }
}
const toText = (buffer) => String(buffer)
const parseJSON = (text) => JSON.parse(text)

const fetchWithJump = async (initialUrl, {
  fetch = fetchLikeRequest,
  jumpMax = 0, // 0 for no jump, use 'Infinity' for unlimited jump
  preFetch, // = (url, jumpCount, cookieList) => {}
  ...option
}) => {
  let url = initialUrl
  let jumpCount = 0
  let cookieList = [ option.headers && option.headers[ 'cookie' ] ].filter(Boolean)
  while (true) {
    preFetch && await preFetch(url, jumpCount, cookieList)
    const response = await fetch(url, { ...option, headers: { ...option.headers, 'cookie': cookieList.join(';') } })
    if (response.status >= 300 && response.status <= 399 && response.headers[ 'location' ]) {
      jumpCount++
      if (jumpCount > jumpMax) throw new Error('JUMP_MAX_REACHED')
      url = new URL(response.headers[ 'location' ], url).href
      cookieList = [ ...cookieList, ...(response.headers[ 'set-cookie' ] || []).map((v) => v.split(';')[ 0 ]) ]
    } else return response
  }
}

export {
  requestHttp,
  ping,
  fetchLikeRequest,
  fetchWithJump
}
