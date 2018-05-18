const throttleByAnimationFrame = (func) => {
  let callArgs = null
  const frameFunc = () => {
    const currentCallArgs = callArgs
    callArgs = null
    func.apply(null, currentCallArgs)
  }
  return (...args) => {
    !callArgs && window.requestAnimationFrame(frameFunc)
    callArgs = args
  }
}

const muteEvent = (event) => {
  event.stopPropagation()
  event.preventDefault()
}
const applyDragFileListListener = (eventSource = window.document, onFileList) => {
  const dropListener = (event) => {
    muteEvent(event)
    const { files } = event.dataTransfer
    files && files.length && onFileList(files) // FileList (Array-like, contains File)
  }
  eventSource.addEventListener('dragenter', muteEvent)
  eventSource.addEventListener('dragover', muteEvent)
  eventSource.addEventListener('drop', dropListener)
  return () => {
    eventSource.removeEventListener('dragenter', muteEvent)
    eventSource.removeEventListener('dragover', muteEvent)
    eventSource.removeEventListener('drop', dropListener)
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

export {
  throttleByAnimationFrame,
  applyDragFileListListener,
  getPathElementList,
  getElementAtViewport
}
