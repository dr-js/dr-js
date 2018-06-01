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
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #0004; }
::-webkit-scrollbar-thumb:hover { background: #0006; }
body { overflow: hidden; display: flex; flex-flow: column; width: 100vw; height: 100vh; font-family: monospace; }
button, .button { text-decoration: none; cursor: pointer; margin: 2px 4px; padding: 2px 4px; border: 0; border-radius: 4px; background: #ddd; }
button:hover, .button:hover { background: #eee; box-shadow: inset 0 0 0 1px #aaa; }
button:disabled, .button:disabled, button:disabled:hover, .button:disabled:hover { cursor: default; background: #fff; box-shadow: unset; }
@media (pointer: fine) { button, .button, .auto-height { min-height: 20px; font-size: 14px; } }
@media (pointer: coarse) { button, .button, .auto-height { min-height: 32px; font-size: 18px; } }
</style>`

const COMMON_SCRIPT = (injectMap = {}) => {
  const valueObject = {}
  const functionScriptList = []
  Object.entries({
    qS: querySelectorFunc,
    qSA: querySelectorAllFunc,
    cE: createElementFunc,
    aCL: appendChildListFunc,
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
const querySelectorFunc = (selector, innerHTML) => {
  const element = document.querySelector(selector)
  if (typeof (innerHTML) === 'string') element.innerHTML = innerHTML
  return element
}
const querySelectorAllFunc = (selector) => [ ...document.querySelectorAll(selector) ]
const createElementFunc = (tagName, attributeMap, childElementList = []) => {
  const element = Object.assign(document.createElement(tagName), attributeMap)
  childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
  return element
}
const appendChildListFunc = (element, childElementList = []) => childElementList.forEach((childElement) => childElement && element.appendChild(childElement))

const DR_BROWSER_SCRIPT = () => `<script>${readFileSync(require.resolve('dr-js/library/Dr.browser'), 'utf8')}</script>`

export {
  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT,
  DR_BROWSER_SCRIPT
}
