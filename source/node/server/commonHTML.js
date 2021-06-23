import { readFileSync } from 'fs'
import { tryRequireResolve } from 'source/env/tryRequire.js'

const DR_BROWSER_FILE_PATH = () => [
  './Dr.browser.js', // maybe after webpack, all file gets merged as `library/output.js`
  '../Dr.browser.js', // relative to `source/env/tryRequire`
  '@dr-js/core/library/Dr.browser.js' // within normal node_module structure
].reduce((o, path) => o || tryRequireResolve(path), null)

let cache = ''
const DR_BROWSER_SCRIPT_TAG = () => {
  if (cache === '') cache = `<script>${readFileSync(DR_BROWSER_FILE_PATH())}</script>`
  return cache
}

// TODO: move to common/string?
const filterJoin = (array) => array.filter(Boolean).join('\n')

const COMMON_LAYOUT = (extraHeadList = [], extraBodyList = []) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="minimum-scale=1, width=device-width">
${filterJoin(extraHeadList)}
</head>
<body>
${filterJoin(extraBodyList)}
</body>
</html>`

const COMMON_STYLE = ({
  boxReset = true,
  bodyReset = true
} = {}) => `<style>
:root { --c-dr: #63aeff; --c-warn: #f22;
  --c-fill-s: hsla(0, 0%, 53%, 0.1); --c-fill-l: hsla(0, 0%, 53%, 0.3); --c-fill-n: hsla(0, 0%, 53%, 0.5); --c-fill-d: hsla(0, 0%, 53%, 0.7);
  --ct-fg-n: #000; --ct-fg-d: #222; --ct-bg-n: #fff; --ct-bg-d: #ddd;
}
@media (prefers-color-scheme: dark) { :root { --ct-fg-n: #fff; --ct-fg-d: #bbb; --ct-bg-n: #000; --ct-bg-d: #222; } }

* { scrollbar-color: var(--c-fill-d) var(--c-fill-l); scrollbar-width: thin; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--c-fill-l); }
::-webkit-scrollbar-thumb { background: var(--c-fill-d); }
::-webkit-scrollbar-thumb:hover { background: var(--c-fill-n); }

*, *::before, *::after { ${boxReset ? 'margin: 0; padding: 0; box-sizing: border-box;' : ''}
  outline-color: var(--c-warn); border-color: var(--c-fill-n);
}
body { ${bodyReset ? 'overflow: auto; display: flex; flex-flow: column; height: 100vh; font-family: monospace; font-size: 16px;' : ''}
}

body, input, textarea, select, button { color: var(--ct-fg-n); }
body, input, textarea, select, option { background: var(--ct-bg-n); }
p, li, td { color: var(--ct-fg-d); }
a { color: var(--c-dr); }

button, .button { text-decoration: none; cursor: pointer; margin: 4px; padding: 4px; min-width: 32px; border: 0; border-radius: 4px; background: var(--c-fill-l); box-shadow: inset 0 0 0 1px var(--c-fill-n); }
button:hover, .button:hover { background: var(--c-fill-n); box-shadow: inset 0 0 0 1px var(--c-fill-d); }
button.select, .button.select { color: var(--c-warn); box-shadow: inset 0 0 0 1px var(--c-warn); }
button:disabled, .button:disabled { cursor: default; background: var(--c-fill-s); box-shadow: unset; }
@media (pointer: fine) { button, .button, .auto-height { min-height: 20px; font-size: 14px; } }
@media (pointer: coarse) { button, .button, .auto-height { min-height: 32px; font-size: 18px; } }
</style>`

const COMMON_SCRIPT = (injectMap) => {
  const valueObject = {}
  const functionScriptList = []
  Object.entries({
    ...COMMON_FUNC_MAP(),
    ...injectMap
  }).forEach(([ key, value ]) => {
    if (typeof (value) === 'function') functionScriptList.push(`<script>window[${JSON.stringify(key)}] = ${String(value)}</script>`)
    else valueObject[ key ] = value
  })
  return filterJoin([
    `<script>Object.assign(window, ${JSON.stringify(valueObject)})</script>`, // object first
    ...functionScriptList
  ])
}

const COMMON_FUNC_MAP = () => ({ // common quick function, intend to attach to window like: `Object.assign(window, COMMON_FUNC_MAP())`
  qS: querySelector,
  qSA: querySelectorAll,
  cE: createElement,
  aCL: appendChildList,
  mECN: modifyElementClassName,
  mEA: modifyElementAttribute,
  iDR: isDocumentReady,
  tDR: tillDocumentReady
})
const querySelector = (selector, innerHTML = undefined) => {
  const element = window.document.querySelector(selector)
  if (element && typeof (innerHTML) === 'string') element.innerHTML = innerHTML
  return element
}
const querySelectorAll = (selector) => [ ...window.document.querySelectorAll(selector) ]
const createElement = (tagName, attributeMap = {}, childElementList = []) => {
  const element = Object.assign(window.document.createElement(tagName), attributeMap)
  childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
  return element
}
const appendChildList = (element, childElementList = []) => childElementList.forEach((childElement) => childElement && element.appendChild(childElement))
const modifyElementClassName = (element, isAdd, ...args) => element.classList[ isAdd ? 'add' : 'remove' ](...args)
const modifyElementAttribute = (element, isAdd, key, value = '') => element[ isAdd ? 'setAttribute' : 'removeAttribute' ](key, value)
const isDocumentReady = () => window.document.readyState === 'complete'
const tillDocumentReady = (func) => {
  const { iDR, document } = window
  if (iDR()) return func()
  const onReady = () => {
    if (!iDR()) return
    document.removeEventListener('readystatechange', onReady)
    func()
  }
  document.addEventListener('readystatechange', onReady)
}

const styleTagMerge = (styleTagStringList) => { // merge <style> ... </style> to single tag, only this format is supported
  const CSSStringList = styleTagStringList.map((styleTagString) => {
    if (styleTagString.startsWith('<style>') && styleTagString.endsWith('</style>')) return styleTagString.slice('<style>'.length, 0 - '</style>'.length)
    else throw new Error(`invalid styleTagString: ${styleTagString}`)
  })
  return `<style>\n${CSSStringList.join('\n')}\n</style>`
}

// TODO: this is fast hack, may broke some complex CSS, can compress CSS in <style> ... </style>
// check: https://gist.github.com/clipperhouse/1201239
const simpleCompactCSS = (CSSString) => CSSString
  .replace(/\s*([,{}();:>])\s*/g, '$1') // remove white-space around common marker, but leave link-break as-is
  .replace(/;}/g, '}') // reduce tail semicolon

export {
  DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG,

  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT, COMMON_FUNC_MAP,

  styleTagMerge,
  simpleCompactCSS
}
