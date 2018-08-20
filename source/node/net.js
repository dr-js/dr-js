import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'
import { createGunzip } from 'zlib'

import { withRetryAsync } from 'source/common/function'
import { receiveBufferAsync } from 'source/node/data/Buffer'

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

// TODO: native fetch do not use timeout but AsyncController
// NOTE:
//   currently should call one of `buffer, text, json` to receive data.
//   These method can only be called once.
//   If not, on nextTick, the data will be dropped.
const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond
const fetch = async (url, {
  method,
  headers: requestHeaders,
  body,
  timeout = DEFAULT_TIMEOUT
} = {}) => {
  const option = { ...urlToOption(new URL(url)), method, headers: { 'accept-encoding': 'gzip', ...requestHeaders }, timeout } // will result in error if timeout
  __DEV__ && console.log('[fetch]', option)
  const response = await requestAsync(option, body)
  const responseHeaders = response.headers
  const status = response.statusCode
  const ok = (status >= 200 && status < 300)
  let isBufferDropped = false
  let bufferPromise
  process.nextTick(() => {
    if (bufferPromise) return
    __DEV__ && console.log('[fetch] payload dropped', timeout)
    response.destroy() // drop response data
    isBufferDropped = true
  })
  const buffer = async () => {
    if (bufferPromise === undefined) {
      if (isBufferDropped) throw new Error('PAYLOAD_ALREADY_DROPPED')
      __DEV__ && console.log('[fetch] pick payload buffer')
      let isBufferTimeout = false
      let isBufferReceived = false
      timeout && setTimeout(() => {
        if (isBufferReceived) return
        __DEV__ && console.log('[fetch] payload timeout', timeout)
        response.destroy()
        isBufferTimeout = true
      }, timeout)
      bufferPromise = receiveBufferAsync(response.headers[ 'content-encoding' ] === 'gzip' ? response.pipe(createGunzip()) : response)
        .then((buffer) => {
          if (isBufferTimeout) throw new Error('PAYLOAD_TIMEOUT')
          isBufferReceived = true
          return buffer
        })
    }
    return bufferPromise
  }
  const text = () => buffer().then((buffer) => buffer.toString())
  const json = () => text().then((text) => JSON.parse(text))
  return { headers: responseHeaders, status, ok, buffer, text, json }
}

// ping with a status code of 500 is still a successful ping
const ping = async ({ url, body, wait = 5000, maxRetry = 0, ...option }) => {
  option = { ...option, ...urlToOption(new URL(url)), timeout: wait } // will result in error if timeout
  await withRetryAsync(async () => {
    const response = await requestAsync(option, body)
    response.destroy() // skip response data
  }, maxRetry, wait)
}

export {
  urlToOption,
  requestAsync,
  fetch,
  ping
}
