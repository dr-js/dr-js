import { readFileSync } from 'fs'

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
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
::-webkit-scrollbar-thumb { background: #0004; }
::-webkit-scrollbar-thumb:hover { background: #0006; }
body { overflow: hidden; display: flex; flex-flow: column; width: 100vw; height: 100vh; font-family: monospace; font-size: 16px; }
button, .button { text-decoration: none; cursor: pointer; margin: 4px; padding: 4px; min-width: 32px; border: 0; border-radius: 4px; background: #ddd; box-shadow: inset 0 0 0 1px #888; }
button:hover, .button:hover { background: #eee; box-shadow: inset 0 0 0 1px #aaa; }
button.select, button:hover.select, .button.select, .button:hover.select { color: #e00; }
button:disabled, button:disabled:hover, .button:disabled, .button:disabled:hover { cursor: default; background: #fff; box-shadow: unset; }
@media (pointer: fine) { 
  ::-webkit-scrollbar { width: 14px; height: 14px; }
  button, .button, .auto-height { min-height: 20px; font-size: 14px; } 
}
@media (pointer: coarse) { 
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  button, .button, .auto-height { min-height: 32px; font-size: 18px; } 
}
</style>`

const COMMON_SCRIPT = (injectMap = {}) => {
  const valueObject = {}
  const functionScriptList = []
  Object.entries({
    qS: querySelectorFunc,
    qSA: querySelectorAllFunc,
    cE: createElementFunc,
    aCL: appendChildListFunc,
    mECN: modifyElementClassName,
    mEA: modifyElementAttribute,
    ...injectMap
  }).forEach(([ key, value ]) => {
    if (typeof (value) === 'function') functionScriptList.push(`<script>window[${JSON.stringify(key)}] = ${value.toString()}</script>`)
    else valueObject[ key ] = value
  })
  return [
    `<script>Object.assign(window, ${JSON.stringify(valueObject)})</script>`, // object first
    ...functionScriptList
  ].join('\n')
}

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
const modifyElementClassName = (element, isAdd, ...args) => element.classList[ isAdd ? 'add' : 'remove' ](...args)
const modifyElementAttribute = (element, isAdd, key, value = '') => element[ isAdd ? 'setAttribute' : 'removeAttribute' ](key, value)

const DR_BROWSER_SCRIPT = () => `<script>${readFileSync(require.resolve('dr-js/library/Dr.browser'), 'utf8')}</script>`

export {
  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT,
  DR_BROWSER_SCRIPT
}
