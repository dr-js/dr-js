import { global } from 'source/env/global'

const { XMLHttpRequest, Blob, TextDecoder } = global

// TODO: later replace with fetch + AbortController
// fetch-like XMLHttpRequest() with timeout
// timeout in msec, result in error with status: -1, message: TIMEOUT_ERROR
const fetchLikeRequest = (url, option = {}) => new Promise((resolve, reject) => {
  const { method = 'GET', headers, body, credentials, timeout, onProgress } = option
  const getError = (message, status) => Object.assign(new Error(message), { status, url, method })
  const request = new XMLHttpRequest()
  request.open(method, url)
  headers && Object.entries(headers).forEach(([ key, value ]) => request.setRequestHeader(key, value))
  request.withCredentials = credentials === 'include' // Setting withCredentials has no effect on same-site requests. check: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  request.timeout = timeout || 0 // in millisecond, 0 for no timeout
  request.responseType = 'arraybuffer'
  request.onerror = () => reject(getError('NETWORK_ERROR', -1))
  request.ontimeout = () => reject(getError('NETWORK_TIMEOUT', -1))
  request.onreadystatechange = () => {
    const { readyState, status } = request
    if (readyState !== 2) return // HEADERS_RECEIVED
    if (status === 0) {
      request.abort()
      return reject(getError('HEADER_STATUS_ERROR', -1)) // can be timeout
    }
    const headers = request.getAllResponseHeaders().split(/[\r\n]+/).reduce((o, rawHeader) => {
      const [ key, ...valueList ] = rawHeader.split(':')
      if (valueList.length) o[ key.trim().toLowerCase() ] = valueList.join(':').trim()
      return o
    }, {})
    const ok = (status >= 200 && status < 300)
    const { arrayBuffer, blob, text, json } = getPayloadGetter(request, getError)
    resolve({ headers, status, ok, arrayBuffer, blob, text, json })
  }
  if (onProgress) request.onprogress = ({ lengthComputable, loaded, total }) => { lengthComputable && onProgress(loaded, total) }
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
  const arrayBuffer = () => {
    if (receivePromise === undefined) {
      if (isDropped) throw getError('PAYLOAD_ALREADY_DROPPED', -1)
      receivePromise = new Promise((resolve, reject) => {
        request.onerror = () => reject(getError('PAYLOAD_ERROR', -1))
        request.ontimeout = () => reject(getError('PAYLOAD_TIMEOUT', -1))
        request.onreadystatechange = () => {
          if (request.readyState !== 4) return // DONE
          if (request.status === 0) return reject(getError('PAYLOAD_STATUS_ERROR', -1)) // can be timeout
          resolve(request.response)
        }
      })
    }
    return receivePromise
  }
  const blob = () => arrayBuffer().then((arrayBuffer) => new Blob([ arrayBuffer ]))
  const text = () => arrayBuffer().then((arrayBuffer) => new TextDecoder().decode(arrayBuffer))
  const json = () => text().then((text) => JSON.parse(text))
  return { arrayBuffer, blob, text, json }
}

export { fetchLikeRequest }
