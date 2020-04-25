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
  const getError = (message, status) => Object.assign(new Error(message), { status, url, method })
  const request = new XMLHttpRequest()
  request.onerror = () => reject(getError('NETWORK_ERROR', -1))
  request.ontimeout = () => reject(getError('NETWORK_TIMEOUT', -1))
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
      ...wrapPayload(request, getError)
    })
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/progress_event
  // quirk: https://stackoverflow.com/questions/11127654/why-is-progressevent-lengthcomputable-false
  if (onProgressUpload && request.upload) request.upload.onprogress = wrapOnProgress(onProgressUpload)
  if (onProgressDownload) request.onprogress = wrapOnProgress(onProgressDownload)
  request.open(method, url)
  requestHeaders && Object.entries(requestHeaders).forEach(([ key, value ]) => request.setRequestHeader(key, value))
  request.responseType = 'arraybuffer'
  request.timeout = timeout || 0
  request.withCredentials = (credentials === 'include') // Setting withCredentials has no effect on same-site requests. check: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  request.send(body || null)
})

const wrapPayload = (request, getError) => {
  let payloadOutcome // KEEP|DROP
  setTimeout(() => {
    if (payloadOutcome) return
    payloadOutcome = 'DROP'
    request.abort() // drop response data
  })
  const arrayBuffer = () => new Promise((resolve, reject) => {
    if (payloadOutcome) return reject(getError(payloadOutcome === 'KEEP' ? 'PAYLOAD_ALREADY_USED' : 'PAYLOAD_ALREADY_DROPPED', -1))
    payloadOutcome = 'KEEP'
    // use `onload` instead of `onreadystatechange` since `onreadystatechange` fires before `ontimeout`, thus masking the `reject` for timeout
    // check: https://stackoverflow.com/questions/23940460/xmlhttprequest-timeout-case-onreadystatechange-executes-before-ontimeout/30054671#30054671
    request.onload = () => resolve(request.response)
    request.onerror = () => reject(getError('PAYLOAD_ERROR', -1))
    request.ontimeout = () => reject(getError('PAYLOAD_TIMEOUT', -1))
  })
  const blob = () => arrayBuffer().then(toBlob)
  const text = () => arrayBuffer().then(toText)
  const json = () => text().then(parseJSON)
  return { arrayBuffer, blob, text, json }
}
const toBlob = (arrayBuffer) => new Blob([ arrayBuffer ])
const toText = (arrayBuffer) => new TextDecoder().decode(arrayBuffer)
const parseJSON = (text) => JSON.parse(text)

const wrapOnProgress = (onProgress) => ({ lengthComputable, loaded, total }) => { onProgress(loaded, lengthComputable ? total : Infinity) }

export { fetchLikeRequest }
