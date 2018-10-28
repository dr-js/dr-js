import nodeModuleUrl from 'url'
import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'

import {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  WebSocketServer,
  WebSocketClient
} from './WebSocket'

const enableWebSocketServer = ({ server, onUpgradeRequest = WebSocketServer.DEFAULT_ON_UPGRADE_REQUEST }) => {
  const webSocketSet = new Set()
  server.on('upgrade', (request, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocketServer(socket)
    const { responseKey } = webSocket.parseUpgradeRequest(request)
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    // select and return protocol from protocolList and optionally save the socket, or call doCloseSocket and reject the socket
    const protocol = onUpgradeRequest(webSocket, request, bodyHeadBuffer)
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    webSocket.doUpgradeSocket(protocol, responseKey)
    __DEV__ && WebSocketClient.isWebSocketClosed(webSocket) && console.log('[onUpgradeResponse] closed webSocket')
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    webSocketSet.add(webSocket)
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      webSocketSet.delete(webSocket)
      __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.CLOSE, current active: ${webSocketSet.size}`)
    })
    __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.OPEN, current active: ${webSocketSet.size}`)
  })
  return webSocketSet
}

const createWebSocketClient = ({ urlString, option = {}, onError, onUpgradeResponse = WebSocketClient.DEFAULT_ON_UPGRADE_RESPONSE }) => {
  const url = nodeModuleUrl.parse(urlString)
  if (!WebSocketClient.VALID_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)) throw new Error(`[createWebSocketClient] invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`[createWebSocketClient] invalid url host: ${url.host}`)
  option.isSecure = WebSocketClient.SECURE_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)

  const { requestOption, requestProtocolString, responseKey } = WebSocketClient.buildUpgradeRequest(url, option)
  const request = (option.isSecure ? nodeModuleHttps : nodeModuleHttp).get(requestOption)

  request.on('error', (error) => {
    if (request.aborted) return
    request.abort()
    onError(error)
  })

  request.on('response', (response) => {
    request.abort()
    onError(new Error('[createWebSocketClient] unexpected response'))
  })

  request.on('upgrade', (response, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocketClient(socket)

    onUpgradeResponse(webSocket, response, bodyHeadBuffer)
    __DEV__ && WebSocketClient.isWebSocketClosed(webSocket) && console.log('[onUpgradeResponse] closed webSocket')
    if (WebSocketClient.isWebSocketClosed(webSocket)) return

    webSocket.doUpgradeSocket(response, requestProtocolString, responseKey)
  })
}

export {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  enableWebSocketServer,
  createWebSocketClient
}
