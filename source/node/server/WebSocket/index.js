import { createHash } from 'crypto'
import { FRAME_TYPE_CONFIG_MAP, DATA_TYPE_MAP, DO_NOT_MASK_DATA, FrameSender, FrameReceiver } from './Frame'

const WEB_SOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const WEB_SOCKET_PONG_TIMEOUT = 60 * 1000 // in msec, 60sec
const WEB_SOCKET_CLOSE_TIMEOUT = 5 * 1000 // in msec, 5sec
const WEB_SOCKET_EVENT_MAP = {
  OPEN: 'web-socket:open',
  FRAME: 'web-socket:frame',
  CLOSE: 'web-socket:close'
}

const NULL_ERROR_LISTENER = () => {}

class WebSocket {
  static CONNECTING = 0 // The connection is not yet open.
  static OPEN = 1 // The connection is open and ready to communicate.
  static CLOSING = 2 // The connection is in the process of closing.
  static CLOSED = 3 // The connection is closed or couldn't be opened.

  constructor (socket, server, request) {
    this.socket = socket
    this.server = server
    this.frameSender = new FrameSender()
    this.frameReceiver = new FrameReceiver()

    // should be public
    this.readyState = WebSocket.CONNECTING
    this.origin = request.headers[ 'origin' ]
    this.isSecure = Boolean(request.connection.authorized || request.connection.encrypted)
    this.key = request.headers[ 'sec-websocket-key' ]
    this.version = parseInt(request.headers[ 'sec-websocket-version' ])
    this.protocolList = (request.headers[ 'sec-websocket-protocol' ] || '').split(/, */)
    this.protocol = null // the accepted protocol

    this.closeTimeoutToken = null
    this.pingTimeoutToken = null
    this.pongTimeoutToken = null

    this.frameDataType = null
    this.frameBufferList = []

    this.onReceiveFrame = this.onReceiveFrame.bind(this)
    this.doCloseSocket = this.doCloseSocket.bind(this)
    this.sendPing = this.sendPing.bind(this)
    this.close = this.close.bind(this)
  }

  doUpgradeSocket () {
    if (this.readyState !== WebSocket.CONNECTING) throw new Error(`[doUpgradeSocket] error readyState ${this.readyState}`)
    this.socket.on('error', this.close)
    this.socket.on('end', this.close)
    const responseKey = createHash('sha1').update(`${this.key}${WEB_SOCKET_MAGIC_STRING}`, 'binary').digest('base64')
    this.socket.write(
      `HTTP/1.1 101\r\nupgrade: websocket\r\nconnection: upgrade\r\nsec-websocket-accept: ${responseKey}\r\n` +
      (this.protocol ? `Sec-WebSocket-Protocol: ${this.protocol}\r\n` : '') +
      `\r\n`
    )
    __DEV__ && console.log('[WebSocket] doUpgradeSocket', responseKey)
    this.frameReceiver.listenAndReceiveFrame(
      this.socket,
      this.onReceiveFrame,
      (error) => this.close(1006, __DEV__ ? `Frame Error: ${error.message}` : '')
    )
    this.readyState = WebSocket.OPEN
    this.server.emit(WEB_SOCKET_EVENT_MAP.OPEN, this)
  }

  doCloseSocket () {
    if (this.readyState === WebSocket.CLOSED) return
    __DEV__ && console.log('[WebSocket] doCloseSocket')

    this.readyState = WebSocket.CLOSED

    this.closeTimeoutToken && clearTimeout(this.closeTimeoutToken)
    this.pingTimeoutToken && clearTimeout(this.pingTimeoutToken)
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.closeTimeoutToken = null
    this.pingTimeoutToken = null
    this.pongTimeoutToken = null

    this.frameSender.clear()
    this.frameReceiver.clear()

    this.socket.removeListener('error', this.close)
    this.socket.removeListener('end', this.close)
    this.socket.on('error', NULL_ERROR_LISTENER)
    this.socket.writable && this.socket.write('HTTP/1.1 400\r\nconnection: close\r\n\r\n') // TODO: HACK: socket.writable not in Official API
    this.socket.destroyed || this.socket.destroy()
    this.socket = null

    this.server.emit(WEB_SOCKET_EVENT_MAP.CLOSE, this)
  }

  onReceiveFrame (frame) { // { isFIN, dataType, dataBuffer }
    switch (frame.dataType) {
      case DATA_TYPE_MAP.OPCODE_CLOSE:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_CLOSE', frame.dataBuffer.readUInt16BE(0, !__DEV__), frame.dataBuffer.slice(2, frame.dataBufferLength).toString())
        return this.close(frame.dataBuffer.readUInt16BE(0, !__DEV__), frame.dataBuffer.slice(2, frame.dataBufferLength).toString())
      case DATA_TYPE_MAP.OPCODE_PING:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PING')
        return this.sendPong(frame.dataBuffer)
      case DATA_TYPE_MAP.OPCODE_PONG:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PONG')
        return this.setNextPing()
    }
    __DEV__ && console.log('[WebSocket] onReceiveFrame', frame.dataType)
    this.setNextPing()
    this.onQueueCompleteFrame(frame)
  }

  onQueueCompleteFrame (frame) {
    if (!this.frameDataType) this.frameDataType = frame.dataType
    this.frameBufferList.push(frame.dataBuffer)

    __DEV__ && !frame.isFIN && console.log('[WebSocket] onQueueCompleteFrame need more')
    if (!frame.isFIN) return // has more frames

    __DEV__ && console.log('[WebSocket] onQueueCompleteFrame got one complete frame')
    const dataType = this.frameDataType
    const dataBuffer = this.frameBufferList.length === 1 ? this.frameBufferList[ 0 ] : Buffer.concat(this.frameBufferList, this.frameBufferList.length)
    this.frameDataType = null
    this.frameBufferList = []

    __DEV__ && console.log('[WebSocket] onQueueCompleteFrame emit one complete frame')
    this.server.emit(WEB_SOCKET_EVENT_MAP.FRAME, this, { dataType, dataBuffer })
  }

  close (code = 1000, reason = '') {
    __DEV__ && console.log('[WebSocket] close', { code, reason })
    if (this.readyState === WebSocket.CLOSED) return
    if (this.readyState === WebSocket.CLOSING) return this.doCloseSocket() // exchanged close frame
    if (this.readyState !== WebSocket.OPEN && this.readyState !== WebSocket.CLOSING) throw new Error(`[close] error readyState = ${this.readyState}`)
    __DEV__ && console.log('[WebSocket] close send to client', { code, reason })

    this.readyState = WebSocket.CLOSING

    this.closeTimeoutToken = setTimeout(this.doCloseSocket, WEB_SOCKET_CLOSE_TIMEOUT)

    this.frameSender.encodeCloseFrame(code, reason, DO_NOT_MASK_DATA)
    this.frameSender.sendEncodedFrame(this.socket).catch(this.doCloseSocket)
  }

  sendText (text) {
    if (this.readyState !== WebSocket.OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${this.readyState}`)
    this.frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_TEXT, Buffer.from(text))
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  sendBuffer (buffer) {
    if (this.readyState !== WebSocket.OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${this.readyState}`)
    this.frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_BINARY, buffer)
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  // requestSendMultiFrameText () { } // TODO:
  // requestSendMultiFrameBuffer () { } // TODO:

  sendPing (data = '') {
    if (this.readyState !== WebSocket.OPEN) return
    this.frameSender.encodePingFrame(data, DO_NOT_MASK_DATA)
    this.frameSender.sendEncodedFrame(this.socket)
    this.setNextPingTimeout()
  }

  sendPong (data) {
    if (this.readyState !== WebSocket.OPEN) return
    this.frameSender.encodePongFrame(data, DO_NOT_MASK_DATA)
    this.frameSender.sendEncodedFrame(this.socket)
  }

  setNextPing () {
    this.pingTimeoutToken && clearTimeout(this.pingTimeoutToken)
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.pingTimeoutToken = setTimeout(this.sendPing, WEB_SOCKET_PONG_TIMEOUT)
    this.pongTimeoutToken = null
  }

  setNextPingTimeout () {
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.pongTimeoutToken = setTimeout(this.close, WEB_SOCKET_PONG_TIMEOUT)
  }
}

const DEFAULT_ON_UPGRADE_REQUEST = (webSocket, request, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT close all
const enableWebSocketServer = ({ server, onUpgradeRequest = DEFAULT_ON_UPGRADE_REQUEST }) => server.on(
  'upgrade',
  (request, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocket(socket, server, request)
    if (
      !webSocket.key ||
      webSocket.version !== 13 ||
      request.method !== 'GET' ||
      request.headers.upgrade.toLowerCase() !== 'websocket'
    ) return webSocket.doCloseSocket()
    onUpgradeRequest(webSocket, request, bodyHeadBuffer) // select and set protocol from protocolList or call doCloseSocket and destroy the socket
    !webSocket.socket.destroyed && webSocket.doUpgradeSocket()
  }
)

export {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  FrameSender,
  FrameReceiver,
  WebSocket,
  enableWebSocketServer
}
