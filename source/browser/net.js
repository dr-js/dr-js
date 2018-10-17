import { global } from 'source/env/global'

const { XMLHttpRequest, Blob, TextDecoder } = global

// TODO: later compare & check if should replace with fetch + AbortController
// fetch-like XMLHttpRequest() with timeout
// timeout in msec, result in error with status: -1, message: TIMEOUT_ERROR
const fetchLikeRequest = (url, {
  method = 'GET',
  headers: requestHeaders,
  body,
  timeout = 0, // in millisecond, 0 for no timeout, will result in error if timeout
  credentials,
  onUploadProgress, // ({ lengthComputable, loaded, total }) => {}
  onDownloadProgress
} = {}) => new Promise((resolve, reject) => {
  const getError = (message, status) => Object.assign(new Error(message), { status, url, method })
  const request = new XMLHttpRequest()
  request.onerror = () => reject(getError('NETWORK_ERROR', -1))
  request.ontimeout = () => reject(getError('NETWORK_TIMEOUT', -1))
  request.onreadystatechange = () => {
    const { readyState, status } = request
    if (readyState !== 2) return // HEADERS_RECEIVED
    if (status === 0) {
      request.abort()
      return reject(getError('HEADER_STATUS_ERROR', -1)) // can be timeout
    }
    const responseHeaders = request.getAllResponseHeaders().split(/[\r\n]+/).reduce((o, rawHeader) => {
      const [ key, ...valueList ] = rawHeader.split(':')
      if (valueList.length) o[ key.trim().toLowerCase() ] = valueList.join(':').trim()
      return o
    }, {})
    resolve({
      status,
      ok: (status >= 200 && status < 300),
      headers: responseHeaders,
      ...wrapPayload(request, getError)
    })
  }
  if (onUploadProgress && request.upload) request.upload.onprogress = onUploadProgress
  if (onDownloadProgress) request.onprogress = onDownloadProgress
  request.open(method, url)
  requestHeaders && Object.entries(requestHeaders).forEach(([ key, value ]) => request.setRequestHeader(key, value))
  request.responseType = 'arraybuffer'
  request.timeout = timeout || 0
  request.withCredentials = (credentials === 'include') // Setting withCredentials has no effect on same-site requests. check: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  request.send(body || null)
})

const wrapPayload = (request, getError) => {
  let isKeep
  let isDropped
  setTimeout(() => {
    if (isKeep) return
    isDropped = true
    request.abort() // drop response data
  })
  const arrayBuffer = () => {
    if (isKeep) throw getError('PAYLOAD_ALREADY_USED', -1) // not receive body twice
    if (isDropped) throw getError('PAYLOAD_ALREADY_DROPPED', -1)
    isKeep = true
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(getError('PAYLOAD_ERROR', -1))
      request.ontimeout = () => reject(getError('PAYLOAD_TIMEOUT', -1))
      request.onreadystatechange = () => {
        if (request.readyState !== 4) return // DONE
        if (request.status === 0) return reject(getError('PAYLOAD_STATUS_ERROR', -1)) // can be timeout
        resolve(request.response)
      }
    })
  }
  const blob = () => arrayBuffer().then(toBlob)
  const text = () => arrayBuffer().then(toText)
  const json = () => text().then(parseJSON)
  return { arrayBuffer, blob, text, json }
}
const toBlob = (arrayBuffer) => new Blob([ arrayBuffer ])
const toText = (arrayBuffer) => new TextDecoder().decode(arrayBuffer)
const parseJSON = (text) => JSON.parse(text)

export { fetchLikeRequest }
