import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME'

const { fetch, navigator, URL, Blob } = window

const createElement = (tagName, attributeMap = {}) => Object.assign(document.createElement(tagName), attributeMap)

const loadText = (url) => fetch(url, { credentials: 'same-origin' }).then((result) => result.text())

const loadImage = (url) => new Promise((resolve, reject) => {
  const element = createElement('img', { src: url, onerror: reject, onload: () => resolve(element) })
})

const loadScript = (url) => new Promise((resolve, reject) => {
  const element = createElement('script', { src: url, async: false, type: BASIC_EXTENSION_MAP.js, onerror: reject, onload: () => resolve(element) })
  document.body.appendChild(element) // TODO: document.body can be null if script is running from <head> tag and page is not fully loaded
})

const createDownload = (fileName, url) => {
  const element = createElement('a', { download: fileName, href: url })
  document.body.appendChild(element) // for Firefox
  element.click()
  document.body.removeChild(element)
}
const createDownloadWithBlob = (fileName, blob) => {
  if (navigator.msSaveOrOpenBlob) return navigator.msSaveOrOpenBlob(blob, fileName) // IE & Edge fix for downloading blob files
  const objectUrl = URL.createObjectURL(blob)
  createDownload(fileName, objectUrl)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
}
const createDownloadWithString = (fileName, string, type = BASIC_EXTENSION_MAP.txt) => createDownloadWithBlob(new Blob([ string ], { type }))
const createDownloadWithObject = (fileName, object, type = BASIC_EXTENSION_MAP.json) => createDownloadWithString(fileName, JSON.stringify(object), type)

export {
  loadText,
  loadImage,
  loadScript,

  createDownload,
  createDownloadWithBlob,
  createDownloadWithString,
  createDownloadWithObject
}
