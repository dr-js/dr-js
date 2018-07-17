import { relative, dirname, join as joinPath } from 'path'
import { compareString } from 'dr-js/module/common/compare'
import { escapeHTML, binary } from 'dr-js/module/common/format'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { createPathPrefixLock, toPosixPath } from 'dr-js/module/node/file/function'
import { getDirectorySubInfoList } from 'dr-js/module/node/file/Directory'
import { responderEndWithRedirect } from 'dr-js/module/node/server/Responder/Common'
import { responderSendBufferCompress } from 'dr-js/module/node/server/Responder/Send'
import { getRouteParamAny } from 'dr-js/module/node/server/Responder/Router'
import { createResponderServeStatic } from 'dr-js/module/node/server/Responder/ServeStatic'
import { COMMON_LAYOUT, COMMON_STYLE } from 'dr-js/module/node/server/commonHTML'
import { getServerInfo, commonCreateServer } from './function'

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
  const relativeRoot = relative(staticRoot, rootPath)
  const titleHTML = `/${formatPathHTML(relativeRoot)}`
  const directoryInfoList = []
  const fileInfoList = []
  const subInfoList = await getDirectorySubInfoList(rootPath)
  subInfoList.forEach((info) => info.stat.isDirectory() ? directoryInfoList.push(info) : fileInfoList.push(info))
  return responderSendBufferCompress(store, {
    type: BASIC_EXTENSION_MAP.html,
    buffer: Buffer.from(COMMON_LAYOUT([
      `<title>${titleHTML}</title>`,
      COMMON_STYLE(),
      mainStyle
    ], [
      `<b class="auto-height">${titleHTML}</b>`,
      relativeRoot && renderItem([ '/list', dirname(relativeRoot) ], '🔙|..'),
      ...directoryInfoList.sort(compareInfo).map(({ name, stat: { mtimeMs } }) => renderItem([ '/list', relativeRoot, name ], `📁|${name}/`, 0, mtimeMs)),
      ...fileInfoList.sort(compareInfo).map(({ name, stat: { size, mtimeMs } }) => renderItem([ '/file', relativeRoot, name ], `📄|${name}`, size, mtimeMs))
    ]))
  })
}

const mainStyle = `<style>
a, b { display: flex; align-items: center; }
a { text-decoration: none; border-top: 1px solid #ddd; }
a:hover { background: #eee; }
span { padding-left: 1em; text-align: right; opacity: 0.5 }
span.flex { flex: 1; }
body { overflow: auto; display: flex; flex-flow: column; white-space: pre; }
</style>`

const compareInfo = ({ name: a }, { name: b }) => compareString(a, b)
const formatPathHref = (fragList) => encodeURI(toPosixPath(joinPath(...fragList)))
const formatPathHTML = (name) => escapeHTML(toPosixPath(name))
const renderItem = (hrefFragList, text, size, mtimeMs) => `<a class="auto-height" href="${formatPathHref(hrefFragList)}">${formatPathHTML(text)}<span class="flex">${size ? `${binary(size)}B` : ''}</span><span>${mtimeMs ? escapeHTML(new Date(mtimeMs).toISOString()) : ''}</span></a>`

export { createServerServeStatic }
