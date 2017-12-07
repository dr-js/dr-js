import nodeModulePath from 'path'
import { Common, Node } from 'module/Dr.node'

const { Module: { BASIC_EXTENSION_MAP }, Format: { escapeHTML, stringIndentLine } } = Common
const {
  File: { FILE_TYPE, getDirectoryContent, createGetPathFromRoot },
  System: { getNetworkIPv4AddressList },
  Server: {
    createServer, createRequestListener,
    Responder: {
      responderEndWithRedirect,
      responderSendBuffer,
      createResponderRouter, createRouteMap, getRouteParamAny,
      createResponderParseURL,
      createResponderServeStatic
    }
  }
} = Node

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
        [ [ '/', '/list' ], 'GET', responderRedirectFilePathList ],
        [ '/favicon.ico', 'GET', responderSendFavicon ]
      ]))
    ]
  }))
  start()
  console.log(`[ServerServeStatic] <${isSimpleServe ? 'no-list' : 'with-list'}>`)
  console.log(`  running at:\n    - '${protocol}//${hostname}:${port}'`)
  console.log(`  staticRoot:\n    - '${staticRoot}'`)
  hostname === '0.0.0.0' && console.log(`  connect at:\n${stringIndentLine(
    getNetworkIPv4AddressList().map(({ address }) => `'${protocol}//${address}:${port}'`).join('\n'),
    '    - '
  )}`)
}

const BUFFER_DATA_FAVICON_PNG = { buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEVjrv/wbTZJAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==', 'base64'), type: BASIC_EXTENSION_MAP.png }
const responderSendFavicon = (store) => responderSendBuffer(store, BUFFER_DATA_FAVICON_PNG)
const responderRedirectFilePathList = (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' })

const getPathContent = async (rootPath) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const content = await getDirectoryContent(rootPath, undefined, true) // single level deep
  const directoryList = Array.from(content[ FILE_TYPE.Directory ].keys())
  const fileList = content[ FILE_TYPE.File ]
  return { directoryList, fileList }
}

// TODO: make reusable
const responderFilePathList = async (store, rootPath, staticRoot) => {
  const relativeRootPath = nodeModulePath.relative(staticRoot, rootPath)
  const titleHTML = `/${formatPathHTML(relativeRootPath)}`
  const HTMLFragList = [ `<b>${titleHTML}</b>` ]
  relativeRootPath && HTMLFragList.push(renderUpperListPath(relativeRootPath))
  const { directoryList, fileList } = await getPathContent(rootPath)
  directoryList.forEach((name) => HTMLFragList.push(renderListPath(relativeRootPath, name)))
  fileList.forEach((name) => HTMLFragList.push(renderFilePath(relativeRootPath, name)))
  return responderSendBuffer(store, { buffer: Buffer.from(renderHTML(titleHTML, HTMLFragList)), type: BASIC_EXTENSION_MAP.html })
}
const renderUpperListPath = (path) => `<a href="${formatPathHref('/list', nodeModulePath.dirname(path))}">🔙|..</a>`
const renderListPath = (path, name) => `<a href="${formatPathHref('/list', path, name)}">📁|${formatPathHTML(name)}</a>`
const renderFilePath = (path, name) => `<a href="${formatPathHref('/file', path, name)}">📄|${formatPathHTML(name)}</a>`
const formatPathHref = (...args) => encodeURI(normalizePathSeparator(nodeModulePath.join(...args)))
const formatPathHTML = (name) => escapeHTML(normalizePathSeparator(name))
const normalizePathSeparator = nodeModulePath.sep === '\\' ? (path) => path.replace(/\\/g, '/') : (path) => path
const renderHTML = (titleHTML, HTMLFragList) => `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="minimum-scale=1, width=device-width">
<title>${titleHTML}</title>
<style>
a { text-decoration: none; border-top: 1px solid #ddd; font-size: 14px; }
a:hover { background: #eee; }
@media (pointer: coarse) { a, b { min-height: 32px; line-height: 32px; font-size: 18px; } }
</style>
<pre style="display: flex; flex-flow: column;">${HTMLFragList.join('\n')}</pre>`

export { createServerServeStatic, getPathContent }
