import { WEBSOCKET_VERSION, WEBSOCKET_EVENT, getRespondKey } from './function'
import { createWebSocket } from './WebSocket'

const DEFAULT_ON_UPGRADE_REQUEST = (webSocket, request, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

const parseUpgradeRequest = (webSocket, request) => {
  const requestKey = request.headers[ 'sec-websocket-key' ]
  const version = parseInt(request.headers[ 'sec-websocket-version' ])
  if (
    !requestKey ||
    version !== WEBSOCKET_VERSION ||
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
  __DEV__ && console.log('[WebSocketServer][doUpgradeSocket]', responseKey)
  webSocket.protocol = protocol
  webSocket.open()
  webSocket.socket.write([
    `HTTP/1.1 101 Switching Protocols`,
    `upgrade: websocket`,
    `connection: upgrade`,
    `sec-websocket-accept: ${responseKey}`,
    protocol && `sec-websocket-protocol: ${protocol}`,
    `\r\n`
  ].filter(Boolean).join('\r\n'))
}

const enableWebSocketServer = ({
  server,
  onUpgradeRequest = DEFAULT_ON_UPGRADE_REQUEST,
  frameLengthLimit
}) => {
  const webSocketSet = new Set()

  server.on('upgrade', async (request, socket, bodyHeadBuffer) => {
    const webSocket = createWebSocket({ socket, frameLengthLimit, isMask: false, shouldPing: true })
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
    webSocket.on(WEBSOCKET_EVENT.CLOSE, () => {
      webSocketSet.delete(webSocket)
      __DEV__ && console.log(`WEBSOCKET_EVENT.CLOSE, current active: ${webSocketSet.size}`)
    })
    __DEV__ && console.log(`WEBSOCKET_EVENT.OPEN, current active: ${webSocketSet.size}`)
  })
  return webSocketSet
}

export { enableWebSocketServer }
