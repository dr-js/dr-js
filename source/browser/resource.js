import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import {
  createElement,

  createDownload,
  createDownloadWithBlob,
  createDownloadWithString,
  createDownloadWithObject,
  saveArrayBufferCache,
  loadArrayBufferCache,
  deleteArrayBufferCache
} from './DOM.js'

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

/** @deprecated */ const createDownloadExport = createDownload // TODO: DEPRECATE
/** @deprecated */ const createDownloadWithBlobExport = createDownloadWithBlob // TODO: DEPRECATE
/** @deprecated */ const createDownloadWithStringExport = createDownloadWithString // TODO: DEPRECATE
/** @deprecated */ const createDownloadWithObjectExport = createDownloadWithObject // TODO: DEPRECATE
/** @deprecated */ const saveArrayBufferCacheExport = saveArrayBufferCache // TODO: DEPRECATE
/** @deprecated */ const loadArrayBufferCacheExport = loadArrayBufferCache // TODO: DEPRECATE
/** @deprecated */ const deleteArrayBufferCacheExport = deleteArrayBufferCache // TODO: DEPRECATE

export {
  loadText, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadImage, // TODO: DEPRECATE: moved to `@dr-js/dev`
  loadScript, // TODO: DEPRECATE: moved to `@dr-js/dev`

  createDownloadExport as createDownload, // TODO: DEPRECATE
  createDownloadWithBlobExport as createDownloadWithBlob, // TODO: DEPRECATE
  createDownloadWithStringExport as createDownloadWithString, // TODO: DEPRECATE
  createDownloadWithObjectExport as createDownloadWithObject, // TODO: DEPRECATE
  saveArrayBufferCacheExport as saveArrayBufferCache, // TODO: DEPRECATE
  loadArrayBufferCacheExport as loadArrayBufferCache, // TODO: DEPRECATE
  deleteArrayBufferCacheExport as deleteArrayBufferCache // TODO: DEPRECATE
}
