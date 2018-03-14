import { now } from 'source/common/time'

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
const addDragFileListListenerToElement = (element, onFileList) => {
  element.addEventListener('dragenter', muteEvent)
  element.addEventListener('dragover', muteEvent)
  element.addEventListener('drop', (event) => {
    muteEvent(event)
    const { files } = event.dataTransfer
    files && files.length && onFileList(files) // FileList (Array-like, contains File)
  })
}

const bindLogElement = (element) => {
  const logTextList = []
  let logTextListLengthMax = 20 // max logTextList length
  let prevTime = now()
  const log = (text) => {
    const currentTime = now()
    logTextList.unshift(`[+${(currentTime - prevTime).toFixed(4)}s] ${text}`) // add to head of the array
    prevTime = currentTime
    if (logTextList.length > logTextListLengthMax) logTextList.length = logTextListLengthMax
    output()
  }
  const output = () => (element.innerHTML = logTextList.join('<br />'))
  return { log, output }
}

const bindFPSElement = (element) => {
  const fpsList = []
  let fpsListLengthMax = 20 // max logTextList length
  let prevTime = now()
  const step = () => {
    const currentTime = now()
    const stepTime = currentTime - prevTime
    prevTime = currentTime
    fpsList.unshift(1 / stepTime)
    if (fpsList.length > fpsListLengthMax) fpsList.length = fpsListLengthMax
    return stepTime
  }
  const output = () => {
    const averageFps = fpsList.reduce((o, v) => (o + v), 0) / fpsList.length
    element.innerHTML = `AVG: ${averageFps.toFixed(2)} | FPS: ${fpsList[ 0 ].toFixed(2)}`
  }
  return { step, output }
}

const debounceByAnimationFrame = (func) => { // TODO: deprecated
  const argvQueue = []
  const frameFunc = () => {
    func(argvQueue)
    argvQueue.length = 0
  }
  return (...argv) => {
    argvQueue.length === 0 && window.requestAnimationFrame(frameFunc) // prevent 'Uncaught TypeError: Illegal invocation' after babel
    argvQueue.push(argv)
  }
}

export {
  throttleByAnimationFrame,

  addDragFileListListenerToElement,

  bindLogElement,
  bindFPSElement,

  debounceByAnimationFrame // TODO: deprecated
}
