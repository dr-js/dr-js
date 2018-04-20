const qS = (selector) => document.querySelector(selector)
const qSS = (selector, innerHTML) => { qS(selector).innerHTML = innerHTML }
const cT = (tagName, attributeMap, ...childTagList) => {
  const tag = Object.assign(document.createElement(tagName), attributeMap)
  childTagList.forEach((childTag) => childTag && tag.appendChild(childTag))
  return tag
}
const pHTML = (HTML) => {
  const divElement = document.createElement('div')
  divElement.innerHTML = HTML
  const elementList = Array.from(divElement.children)
  elementList.forEach((element) => element.remove())
  return elementList
}
const isDocReady = () => document.readyState === 'complete'
const tillDocReady = (func) => isDocReady() ? func() : document.addEventListener('readystatechange', () => isDocReady() && func())
const addContent = (headHTML, bodyHTML, func) => tillDocReady(() => {
  headHTML && pHTML(headHTML).forEach((element) => document.head.appendChild(element))
  bodyHTML && pHTML(bodyHTML).forEach((element) => document.body.appendChild(element))
  func()
})

window.qS = qS
window.qSS = qSS
window.cT = cT
window.pHTML = pHTML
window.tillDocReady = tillDocReady
window.addContent = addContent

addContent(`
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.3); }

button { font: inherit; }
textarea { outline: none; resize: none; background: transparent; }
canvas { background-color: #ddd; margin: 0; padding: 0; border: 0; image-rendering: pixelated; }

.box, .flex-row, .flex-column { max-width: 100%; max-height: 100%; }
.box { overflow: auto; padding: 16px; }
.flex-row { display: flex; flex-flow: row wrap; }
.flex-column { display: flex; flex-flow: column wrap; }
</style>
`, `
<div style="position: fixed; top: 0; left: 0; width: 100%; z-index: -1;">
  <pre id="FPS" style="font-size: 12px; color: #900;">FPS</pre>
  <pre id="LOG" style="font-size: 10px; color: #666;">Log</pre>
</div>
`, () => {
  const { Dr: { Common: { Time: { now }, Module: { UpdateLoop: { createUpdateLoop } } } } } = window

  const createLogList = (maxLength = 20, logList = [], prevTime = now()) => (text, currentTime = now()) => {
    logList.unshift(`[+${(currentTime - prevTime).toFixed(4)}s] ${text}`) // add to head of the array
    prevTime = currentTime
    logList.length = maxLength
    return logList.join('<br />')
  }

  const getFpsStep = (maxLength = 20, fpsList = [], prevTime = now()) => (currentTime = now()) => {
    fpsList.unshift(1 / (currentTime - prevTime))
    prevTime = currentTime
    fpsList.length = maxLength
    const [ sum, min, max ] = fpsList.reduce(([ sum, min, max ], v) => [ sum + v, Math.min(min, v), Math.max(max, v) ], [ 0, Infinity, -Infinity ])
    return `FPS: ${fpsList[ 0 ].toFixed(2)} | AVG: ${(sum / maxLength).toFixed(2)} [${min.toFixed(2)} - ${max.toFixed(2)}]`
  }

  const logList = createLogList()
  const stepFps = getFpsStep()

  const updateLoop = createUpdateLoop()
  updateLoop.start()
  updateLoop.setFunc('fps', () => qSS('#FPS', stepFps()))
  window.updateLoop = updateLoop

  const log = (...args) => {
    console.log(...args)
    qSS('#LOG', logList(args.join(' ')))
  }
  log(`init at: ${now()}`)
  window.log = log
})
