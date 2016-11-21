const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond

// TODO: native fetch do not have a timeout, yet?
const fetch = (url, config = {}) => new Promise((resolve, reject) => {
  const { method = 'GET', headers, body = null, credentials, timeout = DEFAULT_TIMEOUT } = config
  const request = new window.XMLHttpRequest()
  request.open(method, url, true)
  if (headers) for (const key in headers) request.setRequestHeader(key, headers[ key ])
  if ([ 'same-origin', 'include' ].includes(credentials)) request.withCredentials = true
  request.timeout = timeout
  request.addEventListener('error', () => {
    __DEV__ && console.warn('[fetch] error', url, method)
    reject(new Error('error-message-fetch-error'))
  })
  request.addEventListener('timeout', () => {
    __DEV__ && console.warn('[fetch] timeout', url, method)
    request.abort()
    reject(new Error('error-message-fetch-timeout'))
  })
  request.addEventListener('load', () => {
    __DEV__ && console.log('[fetch] load', url, method)
    const { status, response, responseText } = request
    const responseString = String(response || responseText)
    resolve({
      status,
      ok: status < 200 || status >= 300,
      text: () => responseString,
      json: () => JSON.parse(responseString)
    })
  })
  request.send(body)
  __DEV__ && console.log('[fetch] start', url, method)
})

const loadText = (src) => fetch(src)
  .then((result) => result.text())

const loadImage = (src) => new Promise((resolve, reject) => {
  const element = document.createElement('img')
  element.addEventListener('load', () => resolve(element))
  element.addEventListener('error', reject)
  element.src = src
})

const loadScript = (src) => new Promise((resolve, reject) => {
  const element = document.createElement('script')
  element.addEventListener('load', () => resolve(element))
  element.addEventListener('error', reject)
  element.src = src
  element.async = false
  element.type = 'text/javascript'
  document.body.appendChild(element)
})

function createDownload (fileName, src) {
  const element = document.createElement('a')
  element.setAttribute('href', src)
  element.setAttribute('download', fileName)
  document.body.appendChild(element) // for Firefox
  element.click()
  document.body.removeChild(element)
}

const createDownloadText = (fileName, text) => createDownload(fileName, `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
const createDownloadBlob = (fileName, data) => createDownload(fileName, window.URL.createObjectURL(new window.Blob(data)))

export {
  fetch,

  loadText,
  loadImage,
  loadScript,

  createDownload,
  createDownloadText,
  createDownloadBlob
}