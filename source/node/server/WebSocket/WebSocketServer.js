import { DO_NOT_MASK_DATA, DEFAULT_FRAME_LENGTH_LIMIT, WEB_SOCKET_VERSION, WEB_SOCKET_EVENT_MAP, getRespondKey } from './type'
import { createWebSocket } from './WebSocket'

const DEFAULT_ON_UPGRADE_REQUEST = (webSocket, request, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

const parseUpgradeRequest = (webSocket, request) => {
  const requestKey = request.headers[ 'sec-websocket-key' ]
  const version = parseInt(request.headers[ 'sec-websocket-version' ])
  if (
    !requestKey ||
    version !== WEB_SOCKET_VERSION ||
    request.method !== 'GET' ||
    request.headers.upgrade.toLowerCase() !== 'websocket'
  ) return webSocket.doCloseSocket(new Error('invalid upgrade request'))
  webSocket.origin = request.headers[ 'origin' ]
  webSocket.isSecure = Boolean(request.socket.authorized || request.socket.encrypted)
  webSocket.protocolList = (request.headers[ 'sec-websocket-protocol' ] || '').split(/, */)
  return { responseKey: getRespondKey(requestKey) }
}

const doUpgradeSocket = (webSocket, protocol, responseKey) => {
  if (webSocket.getReadyState() !== webSocket.CONNECTING) throw new Error(`[WebSocketServer][doUpgradeSocket] error readyState ${webSocket.getReadyState()}`)
  if (protocol && !webSocket.protocolList.includes(protocol)) throw new Error(`[WebSocketServer][doUpgradeSocket] unexpected protocol ${protocol}`)
  webSocket.socket.on('error', webSocket.close)
  webSocket.socket.on('end', webSocket.close)
  webSocket.socket.write(`HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: upgrade\r\nsec-websocket-accept: ${responseKey}\r\n${protocol ? `sec-websocket-protocol: ${protocol}\r\n` : ''}\r\n`)
  __DEV__ && console.log('[WebSocketServer][doUpgradeSocket]', responseKey)
  webSocket.listenAndReceiveFrame()
  webSocket.protocol = protocol
  webSocket.setReadyState(webSocket.OPEN)
  webSocket.emit(WEB_SOCKET_EVENT_MAP.OPEN)
}

const enableWebSocketServer = ({
  server,
  onUpgradeRequest = DEFAULT_ON_UPGRADE_REQUEST,
  frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT
}) => {
  const webSocketSet = new Set()

  server.on('upgrade', async (request, socket, bodyHeadBuffer) => {
    const webSocket = createWebSocket({ socket, frameLengthLimit, sendFrameMaskType: DO_NOT_MASK_DATA, shouldActivePing: true })
    const { responseKey } = parseUpgradeRequest(webSocket, request)
    if (webSocket.isClosed()) return

    // select and return protocol from protocolList and optionally save the socket, or call doCloseSocket and reject the socket
    const protocol = await onUpgradeRequest(webSocket, request, bodyHeadBuffer)
    if (webSocket.isClosed()) return
    if (!protocol) return webSocket.doCloseSocket(new Error('no selected protocol'))

    doUpgradeSocket(webSocket, protocol, responseKey)
    __DEV__ && webSocket.isClosed() && console.log('[onUpgradeResponse] closed webSocket')
    if (webSocket.isClosed()) return

    webSocketSet.add(webSocket)
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      webSocketSet.delete(webSocket)
      __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.CLOSE, current active: ${webSocketSet.size}`)
    })
    __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.OPEN, current active: ${webSocketSet.size}`)
  })
  return webSocketSet
}

export { enableWebSocketServer }
