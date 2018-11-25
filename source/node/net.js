import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'
import { createGunzip } from 'zlib'

import { withRetryAsync } from 'source/common/function'
import { receiveBufferAsync, toArrayBuffer } from 'source/node/data/Buffer'

const urlToOption = ({ protocol, hostname, hash, search, pathname, href, port, username, password }) => {
  const option = { protocol, hostname, hash, search, pathname, href, path: `${pathname}${search}` }
  if (port !== '') option.port = Number(port)
  if (username || password) option.auth = `${username}:${password}`
  return option
}

const requestAsync = (option, body = null) => new Promise((resolve, reject) => {
  const request = (option.protocol === 'https:' ? httpsRequest : httpRequest)(option, resolve)
  const endWithError = (error) => {
    request.destroy()
    error.option = option
    reject(error)
  }
  request.on('timeout', () => endWithError(new Error(`NETWORK_TIMEOUT`)))
  request.on('error', endWithError)
  request.end(body)
})

// ping with a status code of 500 is still a successful ping
const ping = async ({ url, body, wait = 5000, maxRetry = 0, ...option }) => {
  option = { ...option, ...urlToOption(new URL(url)), timeout: wait } // will result in error if timeout
  await withRetryAsync(async () => {
    const response = await requestAsync(option, body)
    response.destroy() // skip response data
  }, maxRetry, wait)
}

// TODO: native fetch do not use timeout but AsyncController
// NOTE:
//   currently should call one of `buffer, text, json` to receive data.
//   These method can only be called once.
//   If not, on nextTick, the data will be dropped.
const fetchLikeRequest = async (url, {
  method = 'GET',
  headers: requestHeaders,
  body,
  timeout = 10 * 1000 // in millisecond, 0 for no timeout, will result in error if timeout
} = {}) => {
  const option = {
    ...urlToOption(new URL(url)),
    method,
    headers: { 'accept-encoding': 'gzip', ...requestHeaders }, // TODO: NOTE: in node, `GET|DELETE` method will implicitly skip body, add `content-length` to force send body
    timeout
  }
  __DEV__ && console.log('[fetch]', option)
  const response = await requestAsync(option, body)
  // __DEV__ && response.socket.on('close', () => console.log(`[fetch] socket closed`))
  const status = response.statusCode
  return {
    status,
    ok: (status >= 200 && status < 300),
    headers: response.headers,
    ...wrapPayload(response, timeout)
  }
}

const wrapPayload = (response, timeout) => {
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
const toText = (buffer) => buffer.toString()
const parseJSON = (text) => JSON.parse(text)

export {
  urlToOption,
  requestAsync,
  ping,
  fetchLikeRequest
}
