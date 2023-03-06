import { remessageError } from 'source/common/error.js'

const { XMLHttpRequest, Blob, TextDecoder } = window

const REGEXP_HEADER_SEPARATOR = /[\r\n]+/

// TODO: later compare & check if should replace with fetch + AbortController
// fetch-like XMLHttpRequest() with timeout
// timeout in msec, result in error with status: -1, message: TIMEOUT_ERROR
const fetchLikeRequest = (url, {
  method = 'GET',
  headers: requestHeaders,
  body, // String/ArrayBuffer/Blob
  timeout = 0, // in millisecond, 0 for no timeout, will result in error if timeout
  credentials,
  onProgressUpload, // (now, total) => {} // if can't decide total will be `Infinity`
  onProgressDownload // (now, total) => {} // if can't decide total will be `Infinity`
} = {}) => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest()
  const tagError = (error) => remessageError(Object.assign(error, { url, method }), `[${method}|${url}] ${error.message}`)
  request.onerror = () => reject(tagError(new Error('NETWORK_ERROR')))
  request.ontimeout = () => reject(tagError(new Error('NETWORK_TIMEOUT')))
  request.onreadystatechange = () => {
    const { readyState, status } = request
    if (
      readyState !== 2 || // not HEADERS_RECEIVED
      status === 0 // no success
    ) return
    const responseHeaders = request.getAllResponseHeaders().split(REGEXP_HEADER_SEPARATOR).reduce((o, rawHeader) => {
      const [ key, ...valueList ] = rawHeader.split(':')
      if (valueList.length) o[ key.trim().toLowerCase() ] = valueList.join(':').trim()
      return o
    }, {})
    resolve({
      status,
      ok: (status >= 200 && status < 300),
      headers: responseHeaders,
      ..._wrapPayload(request, tagError)
    })
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/progress_event
  // quirk: https://stackoverflow.com/questions/11127654/why-is-progressevent-lengthcomputable-false
  if (onProgressUpload && request.upload) request.upload.onprogress = _wrapOnProgress(onProgressUpload)
  if (onProgressDownload) request.onprogress = _wrapOnProgress(onProgressDownload)
  request.open(method, url)
  requestHeaders && Object.entries(requestHeaders).forEach(([ key, value ]) => request.setRequestHeader(key, value))
  request.responseType = 'arraybuffer'
  request.timeout = timeout || 0
  request.withCredentials = (credentials === 'include') // Setting withCredentials has no effect on same-site requests. check: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  request.send(body || null)
})
const _wrapOnProgress = (onProgress) => ({ lengthComputable, loaded, total }) => { onProgress(loaded, lengthComputable ? total : Infinity) }

const _wrapPayload = (request, tagError) => {
  let payloadOutcome // KEEP|DROP
  setTimeout(() => {
    if (payloadOutcome) return
    payloadOutcome = 'DROP'
    request.abort() // drop response data
  })
  const _arrayBuffer = () => new Promise((resolve, reject) => {
    if (payloadOutcome) return reject(new Error(payloadOutcome === 'KEEP' ? 'PAYLOAD_ALREADY_USED' : 'PAYLOAD_ALREADY_DROPPED'))
    payloadOutcome = 'KEEP'
    // use `onload` instead of `onreadystatechange` since `onreadystatechange` fires before `ontimeout`, thus masking the `reject` for timeout
    // check: https://stackoverflow.com/questions/23940460/xmlhttprequest-timeout-case-onreadystatechange-executes-before-ontimeout/30054671#30054671
    request.onload = () => resolve(request.response)
    request.onerror = () => reject(new Error('PAYLOAD_ERROR'))
    request.ontimeout = () => reject(new Error('PAYLOAD_TIMEOUT'))
  })
  const _onReject = (error) => { throw tagError(error) }
  const arrayBuffer = () => _arrayBuffer().catch(_onReject)
  const blob = () => _arrayBuffer().then((arrayBuffer) => new Blob([ arrayBuffer ])).catch(_onReject)
  const text = () => _arrayBuffer().then((arrayBuffer) => new TextDecoder().decode(arrayBuffer)).catch(_onReject)
  const json = () => _arrayBuffer().then((arrayBuffer) => JSON.parse(new TextDecoder().decode(arrayBuffer))).catch(_onReject)
  return { arrayBuffer, blob, text, json }
}

export { fetchLikeRequest }
