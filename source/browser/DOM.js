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
  eventSource.addEventListener('dragenter', muteEvent)
  eventSource.addEventListener('dragover', muteEvent)
  eventSource.addEventListener('drop', (event) => {
    muteEvent(event)
    const { files } = event.dataTransfer
    files && files.length && onFileList(files) // FileList (Array-like, contains File)
  })
}

export {
  throttleByAnimationFrame,
  applyDragFileListListener
}
