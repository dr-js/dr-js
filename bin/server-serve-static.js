const nodeModulePath = require('path')
const Dr = require('../library/Dr.node')

const {
  Common: {
    Module: { BASIC_EXTENSION_MAP },
    Format: { escapeHTML }
  },
  Node: {
    File: { FILE_TYPE, getDirectoryContent, createGetPathFromRoot },
    Server: {
      createServer, createRequestListener,
      Responder: {
        responderEndWithRedirect,
        responderSendBuffer,
        createResponderRouter, createRouterMap, getRouteParamAny,
        createResponderParseURL,
        createResponderServeStatic
      }
    }
  }
} = Dr

const createServerServeStatic = ({ staticRoot, protocol, hostname, port }) => {
  const { server, start, option } = createServer({ protocol, hostname, port })
  const responderServeStatic = createResponderServeStatic({})
  const fromStaticRoot = createGetPathFromRoot(staticRoot)
  const getParamFilePath = (store) => fromStaticRoot(decodeURI(getRouteParamAny(store)))
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouterMap([
        [ '/favicon.ico', 'GET', responderSendFavicon ],
        [ '/', 'GET', responderRedirectFilePathList ],
        [ '/list', 'GET', responderRedirectFilePathList ],
        [ '/list/*', 'GET', (store) => responderFilePathList(store, getParamFilePath(store), staticRoot) ],
        [ '/file/*', 'GET', (store) => responderServeStatic(store, getParamFilePath(store)) ]
      ]))
    ]
  }))
  start()
  console.log(`[ServerServeStatic]\n  running at: '${protocol}//${hostname}:${port}'\n  staticRoot: '${staticRoot}'`)
}

const BUFFER_DATA_FAVICON_PNG = { buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEVjrv/wbTZJAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==', 'base64'), type: BASIC_EXTENSION_MAP.png }
const responderSendFavicon = (store) => responderSendBuffer(store, BUFFER_DATA_FAVICON_PNG)
const responderRedirectFilePathList = (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' })

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
const getPathContent = async (rootPath) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const content = await getDirectoryContent(rootPath, undefined, true) // single level deep
  const directoryList = Array.from(content[ FILE_TYPE.Directory ].keys())
  const fileList = content[ FILE_TYPE.File ]
  return { directoryList, fileList }
}
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

module.exports = { createServerServeStatic }
