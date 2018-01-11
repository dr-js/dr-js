import nodeModulePath from 'path'
import { Common, Node } from 'module/Dr.node'

const { Module: { BASIC_EXTENSION_MAP }, Format } = Common
const {
  File: { FILE_TYPE, getDirectoryContent },
  Server: {
    getUnusedPort,
    Responder: { responderSendBuffer }
  }
} = Node

const getPathContent = async (rootPath) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const content = await getDirectoryContent(rootPath, undefined, true) // single level deep
  const directoryList = Array.from(content[ FILE_TYPE.Directory ].keys())
  const fileList = content[ FILE_TYPE.File ]
  return { directoryList, fileList }
}

const autoTestServerPort = async (expectPortList, host) => {
  for (const expectPort of expectPortList) {
    try {
      await getUnusedPort(expectPort, host) // expected
      return expectPort
    } catch (error) { __DEV__ && console.log(`[autoTestServerPort] failed for expectPort: ${expectPort}`, error) }
  }
  return getUnusedPort(0, host) // any
}

const BUFFER_DATA_FAVICON_PNG = { buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEVjrv/wbTZJAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==', 'base64'), type: BASIC_EXTENSION_MAP.png }
const responderSendFavicon = (store) => responderSendBuffer(store, BUFFER_DATA_FAVICON_PNG)

const formatPathHref = (...args) => encodeURI(normalizePathSeparator(nodeModulePath.join(...args)))
const formatPathHTML = (name) => Format.escapeHTML(normalizePathSeparator(name))
const normalizePathSeparator = nodeModulePath.sep === '\\' ? (path) => path.replace(/\\/g, '/') : (path) => path

export {
  getPathContent,
  autoTestServerPort,
  responderSendFavicon,
  formatPathHref,
  formatPathHTML,
  normalizePathSeparator
}
