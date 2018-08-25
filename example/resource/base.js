// common quick function
const querySelectorFunc = (selector, innerHTML = undefined) => {
  const element = document.querySelector(selector)
  if (element && typeof (innerHTML) === 'string') element.innerHTML = innerHTML
  return element
}
const querySelectorAllFunc = (selector) => [ ...document.querySelectorAll(selector) ]
const createElementFunc = (tagName, attributeMap = {}, childElementList = []) => {
  const element = Object.assign(document.createElement(tagName), attributeMap)
  childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
  return element
}
const appendChildListFunc = (element, childElementList = []) => childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
const modifyElementClassNameFunc = (element, isAdd, ...args) => element.classList[ isAdd ? 'add' : 'remove' ](...args)
const modifyElementAttributeFunc = (element, isAdd, key, value = '') => element[ isAdd ? 'setAttribute' : 'removeAttribute' ](key, value)
const isDocumentReadyFunc = () => document.readyState === 'complete'
const tillDocumentReadyFunc = (func) => {
  if (window.iDR()) return func()
  const onReady = () => {
    if (!window.iDR()) return
    document.removeEventListener('readystatechange', onReady)
    func()
  }
  document.addEventListener('readystatechange', onReady)
}

const parseHTMLFunc = (HTML) => {
  const elementList = [ ...window.cE('div', { innerHTML: HTML }).children ]
  elementList.forEach((element) => element.remove())
  return elementList
}

Object.assign(window, {
  qS: querySelectorFunc,
  qSA: querySelectorAllFunc,
  cE: createElementFunc,
  aCL: appendChildListFunc,
  mECN: modifyElementClassNameFunc,
  mEA: modifyElementAttributeFunc,
  iDR: isDocumentReadyFunc,
  tDR: tillDocumentReadyFunc,
  pHTML: parseHTMLFunc,
  addContent: (headHTML, bodyHTML, func) => window.tDR(() => {
    headHTML && window.pHTML(headHTML).forEach((element) => document.head.appendChild(element))
    bodyHTML && window.pHTML(bodyHTML).forEach((element) => document.body.appendChild(element))
    func()
  })
})

window.addContent(`
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; outline-color: #f00; }
::-webkit-scrollbar-thumb { background: #0004; }
::-webkit-scrollbar-thumb:hover { background: #0006; }
button, .button { text-decoration: none; cursor: pointer; margin: 4px; padding: 4px; min-width: 32px; border: 0; border-radius: 4px; background: hsla(0, 0%, 70%, 0.4); box-shadow: inset 0 0 0 1px #888; }
button:hover, .button:hover { background: hsla(0, 0%, 80%, 0.4); box-shadow: inset 0 0 0 1px #aaa; }
button.select, button:hover.select, .button.select, .button:hover.select { color: #e00; box-shadow: inset 0 0 0 1px #e00; }
button:disabled, button:disabled:hover, .button:disabled, .button:disabled:hover { cursor: default; background: hsla(0, 0%, 100%, 0.4); box-shadow: unset; }
@media (pointer: fine) { 
  ::-webkit-scrollbar { width: 14px; height: 14px; }
  button, .button, .auto-height { min-height: 20px; font-size: 14px; } 
}
@media (pointer: coarse) { 
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  button, .button, .auto-height { min-height: 32px; font-size: 18px; } 
}

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
  const {
    Dr: {
      Common: {
        Time: { CLOCK_TO_SECOND, clock },
        Module: { UpdateLoop: { createUpdateLoop } }
      }
    }
  } = window

  const createLogList = (maxLength = 20, logList = [], prevTime = clock()) => (text, currentTime = clock()) => {
    const deltaTime = (currentTime - prevTime) * CLOCK_TO_SECOND
    logList.unshift(`[+${deltaTime.toFixed(4)}s] ${text}`) // add to head of the array
    prevTime = currentTime
    logList.length = maxLength
    return logList.join('<br />')
  }

  const getFpsStep = (maxLength = 20, fpsList = [], prevTime = clock()) => (currentTime = clock()) => {
    const deltaTime = (currentTime - prevTime) * CLOCK_TO_SECOND
    fpsList.unshift(deltaTime === 0 ? 0 : 1 / deltaTime)
    prevTime = currentTime
    fpsList.length = maxLength
    const [ sum, min, max ] = fpsList.reduce(([ sum, min, max ], v) => [ sum + v, Math.min(min, v), Math.max(max, v) ], [ 0, Infinity, -Infinity ])
    return `FPS: ${fpsList[ 0 ].toFixed(2)} | AVG: ${(sum / maxLength).toFixed(2)} [${min.toFixed(2)} - ${max.toFixed(2)}]`
  }

  const logList = createLogList()
  const stepFps = getFpsStep()

  const updateLoop = createUpdateLoop()
  updateLoop.start()
  updateLoop.setFunc('fps', () => window.qS('#FPS', stepFps()))

  const log = (...args) => {
    console.log(...args)
    window.qS('#LOG', logList(args.join(' ')))
  }

  log('init')
  window.addEventListener('error', (error) => log('[ERROR]', error.stack || error))

  window.updateLoop = updateLoop
  window.log = log
})
