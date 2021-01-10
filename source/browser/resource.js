import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME'
import { createElement } from './DOM'

const { document, fetch } = window

const loadText = async (uri) => (await fetch(uri)).text() // TODO: DEPRECATE: move to `@dr-js/browser`
const loadImage = (uri) => new Promise((resolve, reject) => createElement('img', { // TODO: DEPRECATE: move to `@dr-js/browser`
  src: uri,
  onerror: reject,
  onload: (event) => resolve(event.currentTarget)
}))
// TODO: document.body can be null if script is running from <head> tag and page is not fully loaded
const loadScript = (uri) => new Promise((resolve, reject) => document.body.appendChild(createElement('script', { // TODO: DEPRECATE: move to `@dr-js/browser`
  src: uri,
  async: false,
  type: BASIC_EXTENSION_MAP.js,
  onerror: reject,
  onload: (event) => resolve(event.currentTarget)
})))

export {
  loadText, // TODO: DEPRECATE: move to `@dr-js/browser`
  loadImage, // TODO: DEPRECATE: move to `@dr-js/browser`
  loadScript // TODO: DEPRECATE: move to `@dr-js/browser`
}

export {
  createDownload, // TODO: DEPRECATE:
  createDownloadWithBlob, // TODO: DEPRECATE:
  createDownloadWithString, // TODO: DEPRECATE:
  createDownloadWithObject, // TODO: DEPRECATE:

  saveArrayBufferCache, // TODO: DEPRECATE:
  loadArrayBufferCache, // TODO: DEPRECATE:
  deleteArrayBufferCache // TODO: DEPRECATE:
} from './DOM'
