import { now } from 'source/common/time'

function createOffscreenCanvas (width, height) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  return element
}

function createStyle (cssText) {
  const element = document.createElement('style')
  element.type = 'text/css'
  element.innerHTML = cssText
  document.body.appendChild(element)
}

function bindLogElement (element) {
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

function bindFPSElement (element) {
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

export {
  createOffscreenCanvas,
  createStyle,

  bindLogElement,
  bindFPSElement
}
