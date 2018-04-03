import { global } from 'source/env'

const DEFAULT_TIMEOUT = 20 * 1000 // 20sec, in millisecond

// TODO: later replace with fetch + AbortController
// fetch-like XMLHttpRequest() with timeout
// timeout in msec, result in error with status: -1, message: TIMEOUT_ERROR
const fetchLikeRequest = (url, option = {}) => new Promise((resolve, reject) => {
  const { method = 'GET', headers, body, credentials, timeout = DEFAULT_TIMEOUT } = option
  const getError = (message, status) => Object.assign(new Error(message), { status, url, method })
  const request = new global.XMLHttpRequest()
  request.open(method, url)
  headers && Object.entries(headers).forEach(([ key, value ]) => request.setRequestHeader(key, value))
  request.withCredentials = credentials === 'include'
  request.timeout = timeout || 0
  request.responseType = 'text'
  request.onerror = () => reject(getError('NETWORK_ERROR', -1))
  request.onreadystatechange = () => {
    const { readyState, status } = request
    if (readyState < 2) return
    if (status === 0) reject(getError('STATUS_ERROR', -1)) // can be timeout
    const ok = (status >= 200 && status < 300)
    const { text, json } = getPayloadGetter(request, getError)
    resolve({ status, ok, text, json })
  }
  request.send(body || null)
})

const getPayloadGetter = (request, getError) => {
  let isDropped = false
  let receivePromise
  setTimeout(() => {
    if (receivePromise) return
    request.abort() // drop response data
    isDropped = true
  })
  const text = () => {
    if (receivePromise === undefined) {
      if (isDropped) throw getError('PAYLOAD_ALREADY_DROPPED', -1)
      receivePromise = new Promise((resolve, reject) => {
        request.onerror = () => reject(getError('RECEIVE_BODY_ERROR', -1))
        request.onreadystatechange = () => request.readyState === 4 && resolve(request.response)
      })
    }
    return receivePromise
  }
  const json = () => text().then((text) => JSON.parse(text))
  return { text, json }
}

export { fetchLikeRequest }
