import { relative, dirname, join as joinPath } from 'path'

import { compareStringWithNumber } from 'dr-js/module/common/compare'
import { binary, time as formatTime } from 'dr-js/module/common/format'
import { escapeHTML } from 'dr-js/module/common/string'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'

import { createPathPrefixLock, toPosixPath } from 'dr-js/module/node/file/function'
import { getDirectorySubInfoList } from 'dr-js/module/node/file/Directory'
import { responderEndWithRedirect } from 'dr-js/module/node/server/Responder/Common'
import { responderSendBufferCompress } from 'dr-js/module/node/server/Responder/Send'
import { getRouteParamAny } from 'dr-js/module/node/server/Responder/Router'
import { createResponderServeStatic } from 'dr-js/module/node/server/Responder/ServeStatic'
import { COMMON_LAYOUT, COMMON_STYLE } from 'dr-js/module/node/server/commonHTML'

import { commonStartServer } from '../function'

const startServerServeStatic = async ({
  isSimpleServe,
  expireTime, // in msec
  staticRoot,
  protocol = 'http:',
  hostname,
  port,
  log
}) => {
  const fromStaticRoot = createPathPrefixLock(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURIComponent(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({ expireTime })

  const routeConfigList = [
    [ isSimpleServe ? '/*' : '/file/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
    !isSimpleServe && [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), staticRoot) ],
    !isSimpleServe && [ [ '/', '/*', '/file', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' }) ]
  ].filter(Boolean)

  await commonStartServer({
    protocol,
    hostname,
    port,
    routeConfigList,
    isAddFavicon: !isSimpleServe,
    title: `ServerServeStatic|${isSimpleServe ? 'no-list' : 'with-list'}`,
    extraInfoList: [
      `staticRoot: '${staticRoot}'`,
      `expireTime: ${formatTime(expireTime)}` ],
    log
  })
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
      relativeRoot && renderItem('/list', [ dirname(relativeRoot) ], '🔙|..'),
      ...directoryInfoList.sort(compareInfo).map(({ name, stat: { mtimeMs } }) => renderItem('/list', [ relativeRoot, name ], `📁|${name}/`, 0, mtimeMs)),
      ...fileInfoList.sort(compareInfo).map(({ name, stat: { size, mtimeMs } }) => renderItem('/file', [ relativeRoot, name ], `📄|${name}`, size, mtimeMs, `download="${name}"`))
    ]))
  })
}

const mainStyle = `<style>
body { white-space: pre; }
a, b { display: flex; align-items: center; }
a { text-decoration: none; border-top: 1px solid #ddd; }
a:hover { background: #eee; }
p.name { overflow: hidden; text-overflow: ellipsis; }
p.size, p.date { padding-left: 1em; text-align: right; opacity: 0.5 }
p.size { flex: 1; }
@media only screen and (max-width: 768px) { p.date { display: none; } }
</style>`

const compareInfo = ({ name: a }, { name: b }) => compareStringWithNumber(a, b)
const formatPathHref = (fragList) => encodeURIComponent(toPosixPath(joinPath(...fragList)))
const formatPathHTML = (name) => escapeHTML(toPosixPath(name))
const renderItem = (hrefPrefix, hrefFragList, text, size, mtimeMs, extraAttr) => `<a class="auto-height" href="${hrefPrefix}/${formatPathHref(hrefFragList)}" ${extraAttr || ''}>
<p class="name">${formatPathHTML(text)}</p>
<p class="size">${size ? `${binary(size)}B` : ''}</p>
<p class="date">${mtimeMs ? escapeHTML(new Date(mtimeMs).toISOString()) : ''}</p>
</a>`

export { startServerServeStatic }
