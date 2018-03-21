import { DEFAULT_MIME } from 'source/common/module/MIME'

const loadText = (url) => window.fetch(url, { credentials: 'same-origin' })
  .then((result) => result.text())

const loadImage = (url) => new Promise((resolve, reject) => {
  const element = document.createElement('img')
  element.addEventListener('load', () => resolve(element))
  element.addEventListener('error', reject)
  element.src = url
})

const loadScript = (url) => new Promise((resolve, reject) => {
  const element = document.createElement('script')
  element.addEventListener('load', () => resolve(element))
  element.addEventListener('error', reject)
  element.src = url
  element.async = false
  element.type = 'text/javascript'
  document.body.appendChild(element)
})

const createDownload = (fileName, url) => {
  const element = document.createElement('a')
  element.download = fileName
  element.href = url
  document.body.appendChild(element) // for Firefox
  element.click()
  document.body.removeChild(element)
}
const createDownloadText = (fileName, text) => createDownload(fileName, `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
const createDownloadBlob = (fileName, dataArray, dataType = DEFAULT_MIME) => {
  const objectUrl = window.URL.createObjectURL(new window.Blob(dataArray, { type: dataType }))
  createDownload(fileName, objectUrl)
  window.URL.revokeObjectURL(objectUrl)
}

export {
  loadText,
  loadImage,
  loadScript,

  createDownload,
  createDownloadText,
  createDownloadBlob
}
