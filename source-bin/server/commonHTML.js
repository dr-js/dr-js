import { readFileSync } from 'fs'

const COMMON_LAYOUT = (extraHeadList = [], extraBodyList = []) => [
  `<!DOCTYPE html><html>`,
  `<head>`,
  `<meta charset="utf-8">`,
  `<meta name="viewport" content="minimum-scale=1, width=device-width">`,
  ...extraHeadList,
  `</head>`,
  `<body style="overflow: hidden; display: flex; flex-flow: column; width: 100vw; height: 100vh; font-family: monospace;">`,
  ...extraBodyList,
  `</body>`,
  `</html>`
].join('\n')

const COMMON_STYLE = () => `<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.3); }
  button, { text-decoration: none; margin: 2px 4px; padding: 2px 4px; border: 0; background: #ddd; }
  button:hover { background: #eee; box-shadow: inset 0 0 0 1px #aaa; }
  @media (pointer: fine) { button, .auto-height { min-height: 20px; font-size: 14px; } }
  @media (pointer: coarse) { button, .auto-height { min-height: 32px; font-size: 18px; } }
</style>`

const COMMON_SCRIPT = () => `<script>Object.assign(window, {
  qS: (selector) => document.querySelector(selector),
  qSS: (selector, innerHTML) => (qS(selector).innerHTML = innerHTML),
  cT: (tagName, attributeMap, ...childTagList) => {
    const tag = Object.assign(document.createElement(tagName), attributeMap)
    childTagList.forEach((childTag) => childTag && tag.appendChild(childTag))
    return tag
  }
})</script>`

const INJECT_GLOBAL_ENV_SCRIPT = (envObject) => `<script>Object.assign(window, ${JSON.stringify(envObject)})</script>`

const DR_BROWSER_SCRIPT = () => `<script>${readFileSync(require.resolve(`../../library/Dr.browser.js`), 'utf8')}</script>`

export {
  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT,
  INJECT_GLOBAL_ENV_SCRIPT,
  DR_BROWSER_SCRIPT
}
