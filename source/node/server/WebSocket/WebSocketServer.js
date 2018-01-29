import { DO_NOT_MASK_DATA } from './Frame'
import { WebSocketBase } from './WebSocketBase'
import { DEFAULT_FRAME_LENGTH_LIMIT, WEB_SOCKET_VERSION, WEB_SOCKET_EVENT_MAP, getRespondKey } from './__utils__'

class WebSocketServer extends WebSocketBase {
  static DEFAULT_ON_UPGRADE_REQUEST = (webSocket, request, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

  constructor (socket, frameLengthLimit) {
    super(socket, frameLengthLimit)

    this.sendFrameMaskType = DO_NOT_MASK_DATA
    this.protocolList = []
  }

  onQueueCompleteFrame (frame) { // { isFIN, dataType, dataBuffer, dataBufferLength }
    const completeFrameData = this.queueCompleteFrame(frame)
    completeFrameData && this.emit(WEB_SOCKET_EVENT_MAP.FRAME, this, completeFrameData)
    this.setNextPing() // [SERVER] delay next ping
  }

  receivePong () {
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.pongTimeoutToken = null
    this.setNextPing()
  }

  parseUpgradeRequest (request) {
    const requestKey = request.headers[ 'sec-websocket-key' ]
    const version = parseInt(request.headers[ 'sec-websocket-version' ])
    if (
      !requestKey ||
      version !== WEB_SOCKET_VERSION ||
      request.method !== 'GET' ||
      request.headers.upgrade.toLowerCase() !== 'websocket'
    ) return this.doCloseSocket(new Error('invalid upgrade request'))
    this.origin = request.headers[ 'origin' ]
    this.isSecure = Boolean(request.connection.authorized || request.connection.encrypted)
    this.protocolList = (request.headers[ 'sec-websocket-protocol' ] || '').split(/, */)
    return { responseKey: getRespondKey(requestKey) }
  }

  doUpgradeSocket (protocol, responseKey) {
    if (this.readyState !== WebSocketBase.CONNECTING) throw new Error(`[WebSocketServer][doUpgradeSocket] error readyState ${this.readyState}`)
    if (protocol && !this.protocolList.includes(protocol)) throw new Error(`[WebSocketServer][doUpgradeSocket] unexpected protocol ${protocol}`)
    this.socket.on('error', this.close)
    this.socket.on('end', this.close)
    this.socket.write(`HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: upgrade\r\nsec-websocket-accept: ${responseKey}\r\n${protocol ? `sec-websocket-protocol: ${protocol}\r\n` : ''}\r\n`)
    __DEV__ && console.log('[WebSocketServer][doUpgradeSocket]', responseKey)
    this.frameReceiver.listenAndReceiveFrame(
      this.socket,
      this.onReceiveFrame,
      (error) => this.close(1006, __DEV__ ? `Frame Error: ${error.message}` : 'Frame Error')
    )
    this.protocol = protocol
    this.readyState = WebSocketBase.OPEN
    this.emit(WEB_SOCKET_EVENT_MAP.OPEN, this)
  }
}

const enableWebSocketServer = ({ server, onUpgradeRequest = WebSocketServer.DEFAULT_ON_UPGRADE_REQUEST, frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT }) => {
  const webSocketSet = new Set()
  server.on('upgrade', async (request, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocketServer(socket, frameLengthLimit)
    const { responseKey } = webSocket.parseUpgradeRequest(request)
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    // select and return protocol from protocolList and optionally save the socket, or call doCloseSocket and reject the socket
    const protocol = await onUpgradeRequest(webSocket, request, bodyHeadBuffer)
    if (WebSocketServer.isWebSocketClosed(webSocket)) return
    if (!protocol) return webSocket.doCloseSocket(new Error('no selected protocol'))

    webSocket.doUpgradeSocket(protocol, responseKey)
    __DEV__ && WebSocketServer.isWebSocketClosed(webSocket) && console.log('[onUpgradeResponse] closed webSocket')
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

export { WebSocketServer, enableWebSocketServer }
