import { relative, dirname, join as joinPath } from 'path'
import { compareString } from 'dr-js/module/common/compare'
import { escapeHTML } from 'dr-js/module/common/format'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { createPathPrefixLock, toPosixPath } from 'dr-js/module/node/file/function'
import { responderEndWithRedirect } from 'dr-js/module/node/server/Responder/Common'
import { responderSendBufferCompress } from 'dr-js/module/node/server/Responder/Send'
import { getRouteParamAny } from 'dr-js/module/node/server/Responder/Router'
import { createResponderServeStatic } from 'dr-js/module/node/server/Responder/ServeStatic'
import { getPathContent, getServerInfo, commonCreateServer } from './function'
import { COMMON_LAYOUT, COMMON_STYLE } from './commonHTML'

const createServerServeStatic = ({ staticRoot, protocol = 'http:', hostname, port, isSimpleServe, log }) => {
  const fromStaticRoot = createPathPrefixLock(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({ expireTime: 1000 }) // 1000 ms expire

  const routeConfigList = isSimpleServe ? [
    [ '/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ]
  ] : [
    [ '/file/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
    [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), staticRoot) ],
    [ [ '/', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' }) ]
  ]

  const { start } = commonCreateServer({ protocol, hostname, port, routeConfigList, isAddFavicon: !isSimpleServe, log })

  start()

  log(getServerInfo(`ServerServeStatic|${isSimpleServe ? 'no-list' : 'with-list'}`, protocol, hostname, port, [ `staticRoot:`, `  - '${staticRoot}'` ]))
}

const responderFilePathList = async (store, rootPath, staticRoot) => {
  const { directoryList, fileList } = await getPathContent(rootPath)
  const relativeRoot = relative(staticRoot, rootPath)
  const titleHTML = `/${formatPathHTML(relativeRoot)}`
  return responderSendBufferCompress(store, {
    buffer: Buffer.from(COMMON_LAYOUT([
      COMMON_STYLE(),
      `<style>a { text-decoration: none; border-top: 1px solid #ddd; }</style>`,
      `<style>a:hover { background: #eee; }</style>`,
      `<title>${titleHTML}</title>`
    ], [
      `<pre style="overflow: auto; display: flex; flex-flow: column;">`,
      `<b class="auto-height">${titleHTML}</b>`,
      relativeRoot && renderItem('..', '🔙', [ '/list', dirname(relativeRoot) ]),
      ...directoryList.sort(compareString).map((name) => renderItem(name, '📁', [ '/list', relativeRoot, name ])),
      ...fileList.sort(compareString).map((name) => renderItem(name, '📄', [ '/file', relativeRoot, name ])),
      `</pre>`
    ])),
    type: BASIC_EXTENSION_MAP.html
  })
}

const renderItem = (text, icon, hrefFragList) => `<a class="auto-height" href="${formatPathHref(hrefFragList)}">${icon}|${formatPathHTML(text)}</a>`
const formatPathHref = (fragList) => encodeURI(toPosixPath(joinPath(...fragList)))
const formatPathHTML = (name) => escapeHTML(toPosixPath(name))

export { createServerServeStatic }
