import { relative, dirname, join as joinPath } from 'path'
import { compareString } from 'dr-js/module/common/compare'
import { escapeHTML } from 'dr-js/module/common/format'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { createPathPrefixLock, toPosixPath } from 'dr-js/module/node/file/function'
import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEndWithRedirect, responderSendBuffer, createResponderParseURL } from 'dr-js/module/node/server/Responder/Common'
import { createResponderRouter, createRouteMap, getRouteParamAny } from 'dr-js/module/node/server/Responder/Router'
import { createResponderServeStatic } from 'dr-js/module/node/server/Responder/ServeStatic'
import { getPathContent, getServerInfo, responderSendFavicon, createResponderLogEnd } from './function'

const createServerServeStatic = ({ staticRoot, protocol = 'http:', hostname, port, isSimpleServe, log }) => {
  const fromStaticRoot = createPathPrefixLock(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({ expireTime: 1000 }) // 1000 ms expire
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
    responderEnd: createResponderLogEnd(log)
  }))

  start()

  log(getServerInfo(`ServerServeStatic|${isSimpleServe ? 'no-list' : 'with-list'}`, protocol, hostname, port, [ `staticRoot:`, `  - '${staticRoot}'` ]))
}

const responderFilePathList = async (store, rootPath, staticRoot) => {
  const { directoryList, fileList } = await getPathContent(rootPath)
  const relativeRoot = relative(staticRoot, rootPath)
  const titleHTML = `/${formatPathHTML(relativeRoot)}`
  const contentHTML = [
    `<b>${titleHTML}</b>`,
    relativeRoot && renderItem('..', '🔙', [ '/list', dirname(relativeRoot) ]),
    ...directoryList.sort(compareString).map((name) => renderItem(name, '📁', [ '/list', relativeRoot, name ])),
    ...fileList.sort(compareString).map((name) => renderItem(name, '📄', [ '/file', relativeRoot, name ]))
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
const formatPathHref = (fragList) => encodeURI(toPosixPath(joinPath(...fragList)))
const formatPathHTML = (name) => escapeHTML(toPosixPath(name))

export { createServerServeStatic }
