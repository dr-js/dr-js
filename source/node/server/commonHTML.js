const COMMON_LAYOUT = (extraHeadList = [], extraBodyList = []) => [
  `<!DOCTYPE html>`,
  `<html>`,
  `<head>`,
  `<meta charset="utf-8">`,
  `<meta name="viewport" content="minimum-scale=1, width=device-width">`,
  ...extraHeadList,
  `</head>`,
  `<body>`,
  ...extraBodyList,
  `</body>`,
  `</html>`
].join('\n')

const COMMON_STYLE = () => `<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; outline-color: #f00; }

* { scrollbar-color: #888a #6664; scrollbar-width: thin; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #8886; }
::-webkit-scrollbar-thumb:hover { background: #888a; }

body { overflow: auto; display: flex; flex-flow: column; height: 100vh; font-family: monospace; font-size: 16px; }

button, .button { text-decoration: none; cursor: pointer; margin: 4px; padding: 4px; min-width: 32px; border: 0; border-radius: 4px; background: hsla(0, 0%, 70%, 0.4); box-shadow: inset 0 0 0 1px #888; }
button:hover, .button:hover { background: hsla(0, 0%, 80%, 0.4); box-shadow: inset 0 0 0 1px #aaa; }
button.select, button:hover.select, .button.select, .button:hover.select { color: #e00; box-shadow: inset 0 0 0 1px #e00; }
button:disabled, button:disabled:hover, .button:disabled, .button:disabled:hover { cursor: default; background: hsla(0, 0%, 100%, 0.4); box-shadow: unset; }
@media (pointer: fine) { button, .button, .auto-height { min-height: 20px; font-size: 14px; } }
@media (pointer: coarse) { button, .button, .auto-height { min-height: 32px; font-size: 18px; } }
</style>`

const COMMON_SCRIPT = (injectMap) => {
  const valueObject = {}
  const functionScriptList = []
  Object.entries({
    qS: querySelector,
    qSA: querySelectorAll,
    cE: createElement,
    aCL: appendChildList,
    mECN: modifyElementClassName,
    mEA: modifyElementAttribute,
    iDR: isDocumentReady,
    tDR: tillDocumentReady,
    ...injectMap
  }).forEach(([ key, value ]) => {
    if (typeof (value) === 'function') functionScriptList.push(`<script>window[${JSON.stringify(key)}] = ${String(value)}</script>`)
    else valueObject[ key ] = value
  })
  return [
    `<script>Object.assign(window, ${JSON.stringify(valueObject)})</script>`, // object first
    ...functionScriptList
  ].join('\n')
}

// common quick function
const querySelector = (selector, innerHTML = undefined) => {
  const element = document.querySelector(selector)
  if (element && typeof (innerHTML) === 'string') element.innerHTML = innerHTML
  return element
}
const querySelectorAll = (selector) => [ ...document.querySelectorAll(selector) ]
const createElement = (tagName, attributeMap = {}, childElementList = []) => {
  const element = Object.assign(document.createElement(tagName), attributeMap)
  childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
  return element
}
const appendChildList = (element, childElementList = []) => childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
const modifyElementClassName = (element, isAdd, ...args) => element.classList[ isAdd ? 'add' : 'remove' ](...args)
const modifyElementAttribute = (element, isAdd, key, value = '') => element[ isAdd ? 'setAttribute' : 'removeAttribute' ](key, value)
const isDocumentReady = () => document.readyState === 'complete'
const tillDocumentReady = (func) => {
  if (window.iDR()) return func()
  const onReady = () => {
    if (!window.iDR()) return
    document.removeEventListener('readystatechange', onReady)
    func()
  }
  document.addEventListener('readystatechange', onReady)
}

export {
  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT
}
