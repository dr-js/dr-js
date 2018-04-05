import { clock } from 'dr-js/module/common/time'
import { time as formatTime } from 'dr-js/module/common/format'
import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { FILE_TYPE } from 'dr-js/module/node/file/File'
import { getDirectoryContent } from 'dr-js/module/node/file/Directory'
import { getNetworkIPv4AddressList } from 'dr-js/module/node/system/NetworkAddress'
import { getUnusedPort } from 'dr-js/module/node/server/Server'
import { responderEnd, responderSendBuffer } from 'dr-js/module/node/server/Responder/Common'

const getPathContent = async (rootPath) => { // The resulting path is normalized and trailing slashes are removed unless the path is resolved to the root directory.
  const content = await getDirectoryContent(rootPath, undefined, true) // single level deep
  return {
    directoryList: Array.from(content[ FILE_TYPE.Directory ].keys()),
    fileList: content[ FILE_TYPE.File ],
    linkList: content[ FILE_TYPE.SymbolicLink ],
    otherList: content[ FILE_TYPE.Other ],
    errorList: content[ FILE_TYPE.Error ]
  }
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

const getServerInfo = (title, protocol, hostname, port, extra = []) => `[${title}]${[
  '',
  ...extra,
  'running at:',
  `  - '${protocol}//${hostname}:${port}'`,
  ...(hostname === '0.0.0.0' ? [
    'connect at:',
    ...getNetworkIPv4AddressList().map(({ address }) => `  - '${protocol}//${address}:${port}'`)
  ] : [])
].join('\n  ')}`

const BUFFER_DATA_FAVICON_PNG = { buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEVjrv/wbTZJAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==', 'base64'), type: BASIC_EXTENSION_MAP.png }
const responderSendFavicon = (store) => responderSendBuffer(store, BUFFER_DATA_FAVICON_PNG)

const createResponderLogEnd = (log) => async (store) => {
  await responderEnd(store)
  const { time, method } = store.getState()
  const { url, headers, socket: { remoteAddress, remotePort } } = store.request
  const host = headers[ 'host' ] || ''
  const userAgent = headers[ 'user-agent' ] || ''
  log(`[${new Date().toISOString()}|${method}] ${host}${url} (${formatTime(clock() - time)}) <${remoteAddress}:${remotePort}> ${userAgent}`)
}

export {
  getPathContent,
  autoTestServerPort,
  getServerInfo,
  responderSendFavicon,
  createResponderLogEnd
}
