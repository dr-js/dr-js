import { readFileSync } from 'fs'
import { FILE_TYPE } from 'dr-js/module/node/file/File'
import { getDirectoryContent } from 'dr-js/module/node/file/Directory'
import { getNetworkIPv4AddressList } from 'dr-js/module/node/system/NetworkAddress'
import { autoTestServerPort } from 'dr-js/module/node/server/function'
import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, createResponderParseURL, createResponderLog, createResponderLogEnd } from 'dr-js/module/node/server/Responder/Common'
import { createResponderFavicon } from 'dr-js/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'

const getPathContent = async (rootPath) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const content = await getDirectoryContent(rootPath, undefined, true) // single level deep
  return {
    directoryList: Array.from(content[ FILE_TYPE.Directory ].keys()),
    fileList: content[ FILE_TYPE.File ],
    linkList: content[ FILE_TYPE.SymbolicLink ],
    otherList: content[ FILE_TYPE.Other ],
    errorList: content[ FILE_TYPE.Error ]
  }
}

const getServerInfo = (title, protocol, hostname, port, extra = []) => `[${title}]\n  ${[
  ...extra,
  'running at:',
  `  - '${protocol}//${hostname}:${port}'`,
  ...(hostname === '0.0.0.0' ? [
    'connect at:',
    ...getNetworkIPv4AddressList().map(({ address }) => `  - '${protocol}//${address}:${port}'`)
  ] : [])
].join('\n  ')}`

const commonCreateServer = ({ protocol, hostname, port, routeConfigList, isAddFavicon, log }) => {
  const { server, start, option } = createServer({ protocol, hostname, port })
  const responderLogEnd = createResponderLogEnd(log)
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderLog(log),
      createResponderRouter(createRouteMap(isAddFavicon
        ? [ ...routeConfigList, [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ] ]
        : routeConfigList
      ))
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
  return { server, start, option }
}

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

const COMMON_SCRIPT = (envObject = {}) => `<script>Object.assign(window, { qS: ${querySelectorFunc}, cT: ${createElementFunc} }, ${JSON.stringify(envObject)})</script>`
const querySelectorFunc = (selector, innerHTML) => {
  const element = document.querySelector(selector)
  if (innerHTML !== undefined) element.innerHTML = innerHTML
  return element
}
const createElementFunc = (tagName, attributeMap, ...childTagList) => {
  const tag = Object.assign(document.createElement(tagName), attributeMap)
  childTagList.forEach((childTag) => childTag && tag.appendChild(childTag))
  return tag
}

const DR_BROWSER_SCRIPT = () => `<script>${readFileSync(require.resolve(`../../library/Dr.browser.js`), 'utf8')}</script>`

export {
  getPathContent,
  autoTestServerPort,
  getServerInfo,
  commonCreateServer,
  COMMON_LAYOUT,
  COMMON_STYLE,
  COMMON_SCRIPT,
  DR_BROWSER_SCRIPT
}
