import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'

import { withRetryAsync } from 'source/common/function'
import { receiveBufferAsync } from 'source/node/data/Buffer'

const urlToOption = ({ protocol, hostname, hash, search, pathname, href, port, username, password }) => {
  const option = { protocol, hostname, hash, search, pathname, href, path: `${pathname}${search}` }
  if (port !== '') option.port = Number(port)
  if (username || password) option.auth = `${username}:${password}`
  return option
}

const requestAsync = (option, body) => new Promise((resolve, reject) => {
  const request = (option.protocol === 'https:' ? httpsRequest : httpRequest)(option, resolve)
  const endWithError = (error) => {
    request.destroy()
    error.option = option
    reject(error)
  }
  request.on('timeout', () => endWithError(new Error(`request timeout`)))
  request.on('error', endWithError)
  request.end(body)
})

// TODO: native fetch do not use timeout but AsyncController
// NOTE:
//   currently should call one of `buffer, text, json` to receive data.
//   These method can only be called once.
//   If not, on nextTick, the data will be dropped.
const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond
const fetch = async (url, config = {}) => {
  const { method, headers, body = null, timeout = DEFAULT_TIMEOUT } = config
  const option = { ...urlToOption(new URL(url)), method, headers, timeout } // will result in error if timeout
  const response = await requestAsync(option, body)
  const status = response.statusCode
  const ok = (status >= 200 && status < 300)
  let isBufferDropped = false
  let bufferPromise
  process.nextTick(() => {
    if (bufferPromise) return
    response.destroy() // drop response data
    isBufferDropped = true
  })
  const buffer = async () => {
    if (bufferPromise === undefined) {
      if (isBufferDropped) throw new Error('[fetch] data already dropped, should call receive data immediately')
      bufferPromise = receiveBufferAsync(response)
    }
    return bufferPromise
  }
  const text = () => buffer().then((buffer) => buffer.toString())
  const json = () => text().then((text) => JSON.parse(text))
  return { status, ok, buffer, text, json }
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
