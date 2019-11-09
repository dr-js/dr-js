import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { createGunzip } from 'zlib'

import { withRetryAsync } from 'source/common/function'
import { receiveBufferAsync, toArrayBuffer } from 'source/node/data/Buffer'

const toUrlObject = (url) => url instanceof URL ? url : new URL(url)

const requestAsync = (
  url,
  option, // { method, headers, timeout, agent, ... }
  body // Buffer/String
) => new Promise((resolve, reject) => {
  const urlObject = toUrlObject(url)
  const request = (urlObject.protocol === 'https:' ? httpsRequest : httpRequest)(urlObject, option, resolve)
  const endWithError = (error) => {
    request.destroy()
    error.urlObject = urlObject
    error.option = option
    reject(error)
  }
  request.on('timeout', () => endWithError(new Error(`NETWORK_TIMEOUT`)))
  request.on('error', endWithError)
  request.end(body)
})

// ping with a status code of 500 is still a successful ping
const ping = async (url, {
  method = 'GET',
  headers,
  body,
  wait = 5 * 1000,
  maxRetry = 0
} = {}) => withRetryAsync(
  async () => { // will result in error if timeout
    const response = await requestAsync(url, { method, headers, timeout: wait }, body)
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
  timeout = 10 * 1000 // in millisecond, 0 for no timeout, will result in error if timeout
} = {}) => {
  const option = {
    method,
    headers: { 'accept-encoding': 'gzip', ...requestHeaders },
    timeout
  }
  __DEV__ && console.log('[fetch]', option)
  const response = await requestAsync(url, option, body)
  // __DEV__ && response.socket.on('close', () => console.log(`[fetch] socket closed`))
  const status = response.statusCode
  return {
    status,
    ok: (status >= 200 && status < 300),
    headers: response.headers,
    ...wrapResponse(response, timeout)
  }
}

// TODO: NODE-BUG: delay pipe IncomingMessage to next event loop or the `end` even will not fire
//   node 6 IncomingMessage events fix
//     - https://github.com/mscdex/busboy/pull/134
//   http: IncomingMessage not emitting 'end'
//     - https://github.com/nodejs/node/issues/10344

const wrapResponse = (response, timeout) => {
  let isKeep
  let isDropped
  process.nextTick(() => {
    if (isKeep) return
    response.destroy() // drop response data
    isDropped = true
    __DEV__ && console.log('[fetch] payload dropped')
  })

  const stream = () => { // TODO: also use async?
    if (isKeep) throw new Error('PAYLOAD_ALREADY_USED') // not receive body twice
    if (isDropped) throw new Error('PAYLOAD_ALREADY_DROPPED')
    __DEV__ && console.log('[fetch] keep payload')
    isKeep = true
    const timeoutToken = timeout && setTimeout(() => {
      // TODO: NOTE: IncomingMessage do not emit `error` event, even when destroy is called here, so manual emit error event
      response.destroy()
      response.emit('error', new Error('PAYLOAD_TIMEOUT'))
      __DEV__ && console.log('[fetch] payload timeout', timeout)
    }, timeout)
    response.on('end', () => timeoutToken && clearTimeout(timeoutToken))
    return response.headers[ 'content-encoding' ] === 'gzip'
      ? response.pipe(createGunzip())
      : response
  }
  const buffer = async () => receiveBufferAsync(stream()) // use async to keep error inside promise
  const arrayBuffer = () => buffer().then(toArrayBuffer)
  const text = () => buffer().then(toText)
  const json = () => text().then(parseJSON)
  return { stream, buffer, arrayBuffer, text, json }
}
const toText = (buffer) => String(buffer)
const parseJSON = (text) => JSON.parse(text)

const fetchWithJump = async (initialUrl, {
  fetch = fetchLikeRequest,
  jumpMax = 0, // 0 for unlimited jump
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
      if (jumpCount > jumpMax) throw new Error(`JUMP_MAX_REACHED`)
      url = new URL(response.headers[ 'location' ], url).href
      cookieList = [ ...cookieList, ...(response.headers[ 'set-cookie' ] || []).map((v) => v.split(';')[ 0 ]) ]
    } else return response
  }
}

export {
  requestAsync,
  ping,
  fetchLikeRequest,
  fetchWithJump
}
