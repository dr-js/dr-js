import nodeModulePath from 'path'
import { Common, Node } from 'module/Dr.node'
import { getPathContent, responderSendFavicon, formatPathHref, formatPathHTML } from './__utils__'

const { Module: { BASIC_EXTENSION_MAP }, Format, Time } = Common
const {
  File: { createGetPathFromRoot },
  System: { getNetworkIPv4AddressList },
  Server: {
    createServer, createRequestListener,
    Responder: {
      responderEnd, responderEndWithRedirect,
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
        [ [ '/', '/list' ], 'GET', (store) => responderEndWithRedirect(store, { redirectUrl: '/list/' }) ],
        [ '/favicon.ico', 'GET', responderSendFavicon ]
      ]))
    ],
    responderEnd: async (store) => {
      await responderEnd(store)
      const { time, method } = store.getState()
      console.log(`[${new Date().toISOString()}|${method}] ${store.request.url} (${Format.time(Time.clock() - time)})`)
    }
  }))
  start()
  console.log(`[ServerServeStatic] <${isSimpleServe ? 'no-list' : 'with-list'}>`)
  console.log(`  staticRoot:\n    - '${staticRoot}'`)
  console.log(`  running at:\n    - '${protocol}//${hostname}:${port}'`)
  hostname === '0.0.0.0' && console.log(`  connect at:\n${Format.stringIndentLine(
    getNetworkIPv4AddressList().map(({ address }) => `'${protocol}//${address}:${port}'`).join('\n'),
    '    - '
  )}`)
}

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

export { createServerServeStatic }
