import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import { createElement } from './DOM.js'

const { document, fetch } = window

/** @deprecated */ const loadText = async (uri) => (await fetch(uri)).text() // TODO: DEPRECATE: moved to `@dr-js/dev`
/** @deprecated */ const loadImage = (uri) => new Promise((resolve, reject) => createElement('img', { // TODO: DEPRECATE: moved to `@dr-js/dev`
  src: uri,
  onerror: reject,
  onload: (event) => resolve(event.currentTarget)
}))
// TODO: document.body can be null if script is running from <head> tag and page is not fully loaded
/** @deprecated */ const loadScript = (uri) => new Promise((resolve, reject) => document.body.appendChild(createElement('script', { // TODO: DEPRECATE: moved to `@dr-js/dev`
  src: uri,
  async: false,
  type: BASIC_EXTENSION_MAP.js,
  onerror: reject,
  onload: (event) => resolve(event.currentTarget)
})))

export {
  loadText, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadImage, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadScript // TODO: DEPRECATE: moved to `@dr-js/dev`
}

export {
  createDownload, // TODO: DEPRECATE:
  createDownloadWithBlob, // TODO: DEPRECATE:
  createDownloadWithString, // TODO: DEPRECATE:
  createDownloadWithObject, // TODO: DEPRECATE:

  saveArrayBufferCache, // TODO: DEPRECATE:
  loadArrayBufferCache, // TODO: DEPRECATE:
  deleteArrayBufferCache // TODO: DEPRECATE:
} from './DOM.js'
