const { fetch } = window

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

const createDownload = (fileName, src) => {
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
  fetch, // TODO: DEPRECATED: use window.fetch

  loadText,
  loadImage,
  loadScript,

  createDownload,
  createDownloadText,
  createDownloadBlob
}
