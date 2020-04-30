import { relative, dirname, join as joinPath } from 'path'

import { compareStringWithNumber } from '@dr-js/core/module/common/compare'
import { binary, time } from '@dr-js/core/module/common/format'
import { escapeHTML } from '@dr-js/core/module/common/string'
import { BASIC_EXTENSION_MAP } from '@dr-js/core/module/common/module/MIME'

import { getPathStat, toPosixPath, createPathPrefixLock } from '@dr-js/core/module/node/file/Path'
import { getDirInfoList } from '@dr-js/core/module/node/file/Directory'
import { responderEndWithRedirect } from '@dr-js/core/module/node/server/Responder/Common'
import { responderSendBufferCompress } from '@dr-js/core/module/node/server/Responder/Send'
import { getRouteParamAny } from '@dr-js/core/module/node/server/Responder/Router'
import { createResponderServeStatic } from '@dr-js/core/module/node/server/Responder/ServeStatic'
import { COMMON_LAYOUT, COMMON_STYLE } from '@dr-js/core/module/node/server/commonHTML'

const configure = ({
  isSimpleServe,
  expireTime, // in msec
  staticRoot
}) => {
  const fromStaticRoot = createPathPrefixLock(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURIComponent(getRouteParamAny(store)))
  const responderServeStatic = createResponderServeStatic({ expireTime })

  const routeConfigList = [
    [ isSimpleServe ? '/*' : '/file/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ],
    !isSimpleServe && [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), staticRoot) ],
    !isSimpleServe && [ [ '/', '/*', '/file', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' }) ]
  ]

  return {
    routeConfigList,
    isAddFavicon: !isSimpleServe,
    title: `ServerServeStatic|${isSimpleServe ? 'no-list' : 'with-list'}`,
    extraInfoList: [ `staticRoot: '${staticRoot}'`, `expireTime: ${time(expireTime)}` ]
  }
}

const responderFilePathList = async (store, rootPath, staticRoot) => {
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
      relativeRoot && renderItem('/list', [ dirname(relativeRoot) ], '🔙', '..'),
      ...directoryInfoList.sort(compareInfo).map(({ name, stat: { mtimeMs } }) => renderItem('/list', [ relativeRoot, name ], '📁', `${name}/`, 0, mtimeMs)),
      ...fileInfoList.sort(compareInfo).map(({ name, stat: { size, mtimeMs } }) => renderItem('/file', [ relativeRoot, name ], '📄', name, size, mtimeMs, true))
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
  hrefPrefix, hrefFragList,
  tag, name, size, mtimeMs, isDownload,
  // generated
  HREF = `href="${hrefPrefix}/${encodeURI(toPosixPath(joinPath(...hrefFragList))).replace(/[?#]/g, (string) => string === '?' ? '%3F' : '%23')}"`, // lazy encode URI to keep more common char alone: new URL ('https://0/;,:@&=+$/').pathname === '/;,:@&=+$/'
  NAME = escapeHTML(name)
) => `<a class="auto-height" ${HREF} ${isDownload ? `download="${NAME}"` : ''}>
<object class="name">${isDownload ? `<a ${HREF} target="_blank">${tag}</a>` : tag}</object>
<p class="name">|${NAME}</p>
<p class="size">${size ? `${binary(size)}B` : ''}</p>
<p class="date">${mtimeMs ? escapeHTML(new Date(mtimeMs).toISOString()) : ''}</p>
</a>`

export { configure }
