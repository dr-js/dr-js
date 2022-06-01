import { relative, dirname, join as joinPath } from 'node:path'

import { compareStringWithNumber } from 'source/common/compare.js'
import { binary, time } from 'source/common/format.js'
import { escapeHTML, lazyEncodeURI } from 'source/common/string.js'
import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import { COMMON_LAYOUT, COMMON_STYLE } from 'source/common/module/HTML.js'

import { getPathStat, toPosixPath, createPathPrefixLock } from 'source/node/fs/Path.js'
import { getDirInfoList } from 'source/node/fs/Directory.js'
import { responderEndWithRedirect } from 'source/node/server/Responder/Common.js'
import { responderSendBufferCompress } from 'source/node/server/Responder/Send.js'
import { METHOD_MAP, getRouteParamAny } from 'source/node/server/Responder/Router.js'
import { createResponderServeStatic } from 'source/node/server/Responder/ServeStatic.js'

const configure = ({
  routePrefix,
  isSimpleServe, isSimpleApi,
  expireTime, // in msec
  staticRoot
}) => {
  const fromStaticRoot = createPathPrefixLock(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURIComponent(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({ expireTime })

  const routeConfigList = isSimpleApi ? [
    [ [ '/', '/*' ], Object.keys(METHOD_MAP), (store) => responderServeStatic(store, fromStaticRoot(`${store.request.url.replace(/\//g, '#')}#[${store.request.method}]`)) ]
  ] : [
    [ isSimpleServe ? '/*' : '/file/*', [ 'GET', 'HEAD' ], (store) => responderServeStatic(store, getParamFilePath(store)) ],
    !isSimpleServe && [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), routePrefix, staticRoot) ],
    !isSimpleServe && [ [ '/', '/*', '/file', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: `${routePrefix}/list/` }) ]
  ]

  return {
    routeConfigList,
    isAddFavicon: !isSimpleServe,
    title: `ServerServeStatic|${isSimpleServe ? 'no-list' : 'with-list'}`,
    extraInfo: { staticRoot, expireTime: time(expireTime) }
  }
}

const responderFilePathList = async (store, rootPath, routePrefix, staticRoot) => {
  const relativeRoot = relative(staticRoot, rootPath)
  const titleHTML = `/${escapeHTML(toPosixPath(relativeRoot))}`
  const directoryInfoList = []
  const fileInfoList = []
  for (const dirInfo of await getDirInfoList(rootPath)) {
    dirInfo.stat = await getPathStat(dirInfo.path) // resolve symlink
    dirInfo.stat.isDirectory() ? directoryInfoList.push(dirInfo) : fileInfoList.push(dirInfo)
  }
  return responderSendBufferCompress(store, {
    type: BASIC_EXTENSION_MAP.html,
    buffer: Buffer.from(COMMON_LAYOUT([
      `<title>${titleHTML}</title>`,
      COMMON_STYLE(),
      mainStyle
    ], [
      `<b class="auto-height">${titleHTML}</b>`,
      relativeRoot && renderItem(routePrefix, '/list', [ dirname(relativeRoot) ], '🔙', '..'),
      ...directoryInfoList.sort(compareInfo).map(({ name, stat: { mtimeMs } }) => renderItem(routePrefix, '/list', [ relativeRoot, name ], '📁', `${name}/`, 0, mtimeMs)),
      ...fileInfoList.sort(compareInfo).map(({ name, stat: { size, mtimeMs } }) => renderItem(routePrefix, '/file', [ relativeRoot, name ], '📄', name, size, mtimeMs, true))
    ]))
  })
}

const mainStyle = `<style>
body { white-space: pre; }
a, b { display: flex; align-items: center; }
a { text-decoration: none; border-top: 1px solid var(--c-fill-n); }
a:hover { background: var(--c-fill-s); }
p.name { overflow: hidden; text-overflow: ellipsis; }
p.size, p.date { padding-left: 1em; text-align: right; opacity: 0.5 }
p.size { flex: 1; }
@media only screen and (max-width: 768px) { p.date { display: none; } }
</style>`

const compareInfo = ({ name: a }, { name: b }) => compareStringWithNumber(a, b)
const renderItem = (
  routePrefix, hrefPrefix, hrefFragList,
  tag, name, size, mtimeMs, isDownload,
  // generated
  HREF = `href="${routePrefix}${hrefPrefix}/${lazyEncodeURI(toPosixPath(joinPath(...hrefFragList)))}"`,
  NAME = escapeHTML(name),
  NAME_EXT = (/\.(\w{1,5})$/.exec(NAME) || [])[ 1 ] || ''
) => `<a class="auto-height" ${HREF} ${isDownload ? 'target="_blank"' : ''}>
<object class="name">${isDownload ? `<a ${HREF} download="${NAME}">${tag}</a>` : tag}</object>
<p class="name">|${NAME.slice(0, -NAME_EXT.length || undefined)}</p>
<p>${NAME_EXT}</p>
<p class="size">${size ? `${binary(size)}B` : ''}</p>
<p class="date">${mtimeMs ? escapeHTML(new Date(mtimeMs).toISOString()) : ''}</p>
</a>`

export { configure }
