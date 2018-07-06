import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME'

const { fetch, URL, Blob } = window

const loadText = (url) => fetch(url, { credentials: 'same-origin' })
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
  element.type = BASIC_EXTENSION_MAP.js
  document.body.appendChild(element) // TODO: document.body can be null if script is running from <head> tag and page is not fully loaded
})

const createDownload = (fileName, url) => {
  const element = Object.assign(document.createElement('a'), { download: fileName, href: url })
  document.body.appendChild(element) // for Firefox
  element.click()
  document.body.removeChild(element)
}
const createDownloadWithString = (fileName, string, type = BASIC_EXTENSION_MAP.txt) => (string.length <= (5 << 20))
  ? createDownload(fileName, `data:${type};charset=utf-8,${encodeURIComponent(string)}`) // use dataUri if less than about 5MB
  : createDownloadWithBlob(new Blob([ string ], { type }))
const createDownloadWithObject = (fileName, object, type = BASIC_EXTENSION_MAP.json) => createDownloadWithString(fileName, JSON.stringify(object), type)
const createDownloadWithBlob = (fileName, blob) => {
  const objectUrl = URL.createObjectURL(blob)
  createDownload(fileName, objectUrl)
  URL.revokeObjectURL(objectUrl)
}

export {
  loadText,
  loadImage,
  loadScript,

  createDownload,
  createDownloadWithString,
  createDownloadWithObject,
  createDownloadWithBlob
}
