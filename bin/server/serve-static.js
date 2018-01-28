import nodeModulePath from 'path'
import { clock } from 'dr-js/module/common/time'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import * as Format from 'dr-js/module/common/format'
import { createGetPathFromRoot } from 'dr-js/module/node/file'
import { createServer, createRequestListener, Responder } from 'dr-js/module/node/server'
import { getPathContent, responderSendFavicon, getServerInfo } from './__utils__'

const {
  responderEnd, responderEndWithRedirect,
  responderSendBuffer,
  createResponderRouter, createRouteMap, getRouteParamAny,
  createResponderParseURL,
  createResponderServeStatic
} = Responder

const createServerServeStatic = ({ staticRoot, protocol, hostname, port, isSimpleServe }) => {
  const fromStaticRoot = createGetPathFromRoot(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({})
  const { server, start, option } = createServer({ protocol, hostname, port })
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouteMap(isSimpleServe ? [
        [ '/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ]
      ] : [
        [ '/file/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
        [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), staticRoot) ],
        [ [ '/', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' }) ],
        [ '/favicon.ico', 'GET', responderSendFavicon ]
      ]))
    ],
    responderEnd: async (store) => {
      await responderEnd(store)
      const { time, method } = store.getState()
      console.log(`[${new Date().toISOString()}|${method}] ${store.request.url} (${Format.time(clock() - time)})`)
    }
  }))
  start()
  console.log(`[ServerServeStatic] ${isSimpleServe ? 'no-list' : 'with-list'}`)
  console.log(Format.stringIndentLine([
    `staticRoot:`,
    `  - '${staticRoot}'`,
    getServerInfo(protocol, hostname, port)
  ].join('\n'), '  '))
}

const responderFilePathList = async (store, rootPath, staticRoot) => {
  const { directoryList, fileList } = await getPathContent(rootPath)
  const relativeRoot = nodeModulePath.relative(staticRoot, rootPath)
  const titleHTML = `/${formatPathHTML(relativeRoot)}`
  const contentHTML = [
    `<b>${titleHTML}</b>`,
    relativeRoot && renderItem('..', '🔙', [ '/list', nodeModulePath.dirname(relativeRoot) ]),
    ...directoryList.map((name) => renderItem(name, '📁', [ '/list', relativeRoot, name ])),
    ...fileList.map((name) => renderItem(name, '📄', [ '/file', relativeRoot, name ]))
  ].join('\n')
  return responderSendBuffer(store, { buffer: Buffer.from(renderHTML(titleHTML, contentHTML)), type: BASIC_EXTENSION_MAP.html })
}

const renderHTML = (titleHTML, contentHTML) => `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="minimum-scale=1, width=device-width">
<title>${titleHTML}</title>
<style>
a { text-decoration: none; border-top: 1px solid #ddd; }
a:hover { background: #eee; }
@media (pointer: coarse) { a, b { min-height: 32px; line-height: 32px; font-size: 18px; } }
@media (pointer: fine) { a, b { min-height: 20px; line-height: 20px; font-size: 14px; } }
</style>
<pre style="display: flex; flex-flow: column;">${contentHTML}</pre>`
const renderItem = (text, icon, hrefFragList) => `<a href="${formatPathHref(hrefFragList)}">${icon}|${formatPathHTML(text)}</a>`
const formatPathHref = (fragList) => encodeURI(normalizePathSeparator(nodeModulePath.join(...fragList)))
const formatPathHTML = (name) => Format.escapeHTML(normalizePathSeparator(name))
const normalizePathSeparator = nodeModulePath.sep === '\\' ? (path) => path.replace(/\\/g, '/') : (path) => path

export { createServerServeStatic }
