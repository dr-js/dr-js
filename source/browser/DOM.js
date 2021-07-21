import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'

const { requestAnimationFrame, document, navigator, caches, URL, Blob, Request, Response } = window

const throttleByAnimationFrame = (func) => {
  let callArgs = null
  const frameFunc = () => {
    const currentCallArgs = callArgs
    callArgs = null
    func.apply(null, currentCallArgs)
  }
  return (...args) => {
    !callArgs && requestAnimationFrame(frameFunc)
    callArgs = args
  }
}

// TODO: use modern https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/items (wait Safari, or not?)
const applyReceiveFileListListener = (eventSource = document, onFileList) => {
  const muteEvent = (event) => {
    event.stopPropagation()
    event.preventDefault()
  }
  const pasteListener = (event) => {
    const { files } = event.dataTransfer || event.clipboardData
    files && files.length && onFileList(files) // FileList (Array-like, contains File)
  }
  const dropListener = (event) => {
    muteEvent(event) // or browser will redirect to the dropped file
    pasteListener(event)
  }
  eventSource.addEventListener('dragenter', muteEvent)
  eventSource.addEventListener('dragover', muteEvent)
  eventSource.addEventListener('drop', dropListener)
  eventSource.addEventListener('paste', pasteListener)
  return () => {
    eventSource.removeEventListener('dragenter', muteEvent)
    eventSource.removeEventListener('dragover', muteEvent)
    eventSource.removeEventListener('drop', dropListener)
    eventSource.removeEventListener('paste', pasteListener)
  }
}

// return the path between 2 node (no fromElement, include toElement)
// fromElement, [ element, element, element, toElement ]
const getPathElementList = (fromElement, toElement) => {
  if (!fromElement.contains(toElement)) return []
  let element = toElement
  const elementList = []
  while (element !== fromElement) {
    elementList.unshift(element)
    element = element.parentElement
  }
  return elementList
}

const getElementAtViewport = (clientPosition, excludeElementList) => {
  const styleRecoverList = excludeElementList && excludeElementList.map((element) => {
    const { visibility } = element.style
    element.style.visibility = 'hidden' // Temporarily hide the element (without changing the layout)
    return visibility
  })
  const elementUnder = document.elementFromPoint(clientPosition.x, clientPosition.y)
  excludeElementList && excludeElementList.forEach((element, index) => (element.style.visibility = styleRecoverList[ index ]))
  return elementUnder
}

const createElement = (tagName, attributeMap = {}) => Object.assign(document.createElement(tagName), attributeMap)

// Download
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
const createDownloadWithString = (fileName, string, type = BASIC_EXTENSION_MAP.txt) => createDownloadWithBlob(fileName, new Blob([ string ], { type }))
const createDownloadWithObject = (fileName, object, type = BASIC_EXTENSION_MAP.json) => createDownloadWithString(fileName, JSON.stringify(object), type)

// ArrayBufferCache // TODO: NOTE: this requires `window.caches` (after WebWorker)
const saveArrayBufferCache = async (bucketName, key, arrayBuffer) => {
  const cache = await caches.open(bucketName)
  await cache.put(new Request(key), new Response(arrayBuffer))
  return { bucketName, key }
}
const loadArrayBufferCache = async (bucketName, key) => {
  const cache = await caches.open(bucketName)
  const response = await cache.match(new Request(key))
  return response && response.arrayBuffer()
}
const deleteArrayBufferCache = async (bucketName, key) => {
  if (!key) return caches.delete(bucketName)
  const cache = await caches.open(bucketName)
  return cache && cache.delete(new Request(key))
}

export {
  throttleByAnimationFrame,
  applyReceiveFileListListener,
  getPathElementList,
  getElementAtViewport,

  createElement,

  createDownload,
  createDownloadWithBlob,
  createDownloadWithString,
  createDownloadWithObject,

  saveArrayBufferCache,
  loadArrayBufferCache,
  deleteArrayBufferCache
}
