import { createHash, randomBytes } from 'crypto'
import { EventEmitter } from 'source/common/module'
import { urlToOption } from 'source/node/resource'
import { FRAME_TYPE_CONFIG_MAP, DATA_TYPE_MAP, DO_MASK_DATA, DO_NOT_MASK_DATA, FrameSender, FrameReceiver } from './Frame'

const WEB_SOCKET_VERSION = 13

const WEB_SOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const getRequestKey = () => randomBytes(16).toString('base64')
const getRespondKey = (requestKey) => createHash('sha1').update(`${requestKey}${WEB_SOCKET_MAGIC_STRING}`).digest('base64')

const WEB_SOCKET_EVENT_MAP = {
  OPEN: 'web-socket:open',
  FRAME: 'web-socket:frame',
  CLOSE: 'web-socket:close'
}

const WEB_SOCKET_PING_PONG_TIMEOUT = __DEV__ ? 5 * 1000 : 60 * 1000 // in msec, 60sec
const WEB_SOCKET_CLOSE_TIMEOUT = __DEV__ ? 0.5 * 1000 : 5 * 1000 // in msec, 5sec

const NULL_ERROR_LISTENER = (error) => { __DEV__ && error && console.log('[NULL_ERROR_LISTENER] get error', error) }

class WebSocketBase extends EventEmitter {
  static CONNECTING = 0 // The connection is not yet open.
  static OPEN = 1 // The connection is open and ready to communicate.
  static CLOSING = 2 // The connection is in the process of closing.
  static CLOSED = 3 // The connection is closed or couldn't be opened.

  static isWebSocketClosed = (webSocket) => (webSocket.readyState === WebSocketBase.CLOSED || !webSocket.socket || webSocket.socket.destroyed)

  constructor (socket, frameLengthLimit) {
    super()

    this.socket = socket
    this.frameSender = new FrameSender(frameLengthLimit)
    this.frameReceiver = new FrameReceiver(frameLengthLimit)
    this.frameLengthLimit = frameLengthLimit

    // should be public
    this.readyState = WebSocketBase.CONNECTING

    this.origin = null
    this.isSecure = false
    this.protocol = null // the accepted protocol

    this.closeTimeoutToken = null
    this.pingTimeoutToken = null
    this.pongTimeoutToken = null

    this.frameDataType = null
    this.frameBufferList = []
    this.frameBufferLength = 0

    this.sendFrameMaskType = null // DO_MASK_DATA | DO_NOT_MASK_DATA

    this.onReceiveFrame = this.onReceiveFrame.bind(this)
    this.doCloseSocket = this.doCloseSocket.bind(this)
    this.sendPing = this.sendPing.bind(this)
    this.close = this.close.bind(this)
  }

  doCloseSocket (error) {
    __DEV__ && error && console.log('[doCloseSocket] get error', error)

    if (this.readyState === WebSocketBase.CLOSED) return
    __DEV__ && console.log('[WebSocket] doCloseSocket')

    this.readyState === WebSocketBase.CONNECTING && this.socket.writable && this.socket.write('HTTP/1.1 400 Bad Request\r\nconnection: close\r\n\r\n') // TODO: HACK: socket.writable not in Official API
    this.readyState = WebSocketBase.CLOSED

    this.closeTimeoutToken && clearTimeout(this.closeTimeoutToken)
    this.pingTimeoutToken && clearTimeout(this.pingTimeoutToken)
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.closeTimeoutToken = null
    this.pingTimeoutToken = null
    this.pongTimeoutToken = null

    this.frameSender.queuePromise(NULL_ERROR_LISTENER, NULL_ERROR_LISTENER)
    this.frameReceiver.queuePromise(NULL_ERROR_LISTENER, NULL_ERROR_LISTENER)
    this.frameSender.clear()
    this.frameReceiver.clear()

    this.socket.removeListener('error', this.close)
    this.socket.removeListener('end', this.close)
    this.socket.on('error', NULL_ERROR_LISTENER)
    this.socket.destroyed || this.socket.destroy()
    this.socket = null

    this.emit(WEB_SOCKET_EVENT_MAP.CLOSE, this)
  }

  queueCompleteFrame (frame) {
    if (!this.frameDataType) this.frameDataType = frame.dataType
    this.frameBufferList.push(frame.dataBuffer)
    this.frameBufferLength += frame.dataBuffer.length
    if (this.frameBufferLength > this.frameLengthLimit) throw new Error(`[queueCompleteFrame] frameBufferList length ${this.frameBufferLength} exceeds limit: ${this.frameLengthLimit}`)

    __DEV__ && !frame.isFIN && console.log('[WebSocket] onQueueCompleteFrame need more', this.frameBufferList.length, this.frameBufferLength)
    if (!frame.isFIN) return null// has more frames

    __DEV__ && console.log('[WebSocket] onQueueCompleteFrame got one complete frame', this.frameBufferList.length, this.frameBufferLength)
    const dataType = this.frameDataType
    const dataBuffer = this.frameBufferList.length === 1 ? this.frameBufferList[ 0 ] : Buffer.concat(this.frameBufferList, this.frameBufferLength)
    this.frameDataType = null
    this.frameBufferList = []
    this.frameBufferLength = 0

    // __DEV__ && console.log('[WebSocket] onQueueCompleteFrame emit one complete frame')
    return { dataType, dataBuffer }
  }

  onReceiveFrame (frame) { // { isFIN, dataType, dataBuffer, dataBufferLength }
    switch (frame.dataType) {
      case DATA_TYPE_MAP.OPCODE_CLOSE: {
        const code = (frame.dataBufferLength >= 2 && frame.dataBuffer.readUInt16BE(0, !__DEV__)) || 1000
        const reason = (frame.dataBufferLength >= 3 && frame.dataBuffer.slice(2, frame.dataBufferLength).toString()) || ''
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_CLOSE', { code, reason })
        return this.close(code, reason)
      }
      case DATA_TYPE_MAP.OPCODE_PING:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PING', frame.dataBuffer)
        return this.sendPong(frame.dataBuffer)
      case DATA_TYPE_MAP.OPCODE_PONG:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PONG')
        return this.receivePong()
    }
    __DEV__ && console.log('[WebSocket] onReceiveFrame', frame.dataType)
    this.onQueueCompleteFrame(frame)
  }

  onQueueCompleteFrame (frame) { // { isFIN, dataType, dataBuffer, dataBufferLength }
    const completeFrameData = this.queueCompleteFrame(frame)
    completeFrameData && this.emit(WEB_SOCKET_EVENT_MAP.FRAME, this, completeFrameData)
  }

  close (code = 1000, reason = '') {
    // __DEV__ && console.log('[WebSocket] want to close', { code, reason })
    if (__DEV__ && this.readyState === WebSocketBase.CLOSED) console.log('[WebSocket][close] close ignored, readyState is already CLOSED')
    if (this.readyState === WebSocketBase.CLOSED) return
    if (__DEV__ && this.readyState === WebSocketBase.CLOSING) console.log('[WebSocket][close] directly doCloseSocket, readyState is CLOSING')
    if (this.readyState === WebSocketBase.CLOSING) return this.doCloseSocket() // exchanged close frame
    if (this.readyState !== WebSocketBase.OPEN && this.readyState !== WebSocketBase.CLOSING) throw new Error(`[close] error readyState = ${this.readyState}`)
    __DEV__ && console.log('[WebSocket][close] send close frame', { code, reason })
    this.readyState = WebSocketBase.CLOSING
    this.closeTimeoutToken = setTimeout(this.doCloseSocket, WEB_SOCKET_CLOSE_TIMEOUT)
    this.frameSender.encodeCloseFrame(code, reason, this.sendFrameMaskType)
    if (code === 1000) this.frameSender.sendEncodedFrame(this.socket).catch(this.doCloseSocket)
    else this.frameSender.sendEncodedFrame(this.socket).then(this.doCloseSocket, this.doCloseSocket) // close faster on error
  }

  sendText (text) {
    if (this.readyState !== WebSocketBase.OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${this.readyState}`)
    __DEV__ && console.log('sendText', text.slice(0, 20))
    this.frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_TEXT, Buffer.from(text), this.sendFrameMaskType)
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  sendBuffer (buffer) {
    if (this.readyState !== WebSocketBase.OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${this.readyState}`)
    __DEV__ && console.log('sendBuffer', buffer.length)
    this.frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_BINARY, buffer, this.sendFrameMaskType)
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  // requestSendMultiFrameText () { } // TODO:
  // requestSendMultiFrameBuffer () { } // TODO:

  setNextPing () {
    this.pingTimeoutToken && clearTimeout(this.pingTimeoutToken)
    this.pingTimeoutToken = setTimeout(this.sendPing, WEB_SOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPing')
  }

  setNextPong () {
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.pongTimeoutToken = setTimeout(() => this.close(1006, 'pong timeout'), WEB_SOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPong')
  }

  sendPing (data = 'PING') {
    if (this.readyState !== WebSocketBase.OPEN) return
    __DEV__ && console.log('sendPing', data.toString())
    this.setNextPong()
    this.frameSender.encodePingFrame(data, this.sendFrameMaskType)
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  sendPong (data = 'PONG') {
    if (this.readyState !== WebSocketBase.OPEN) return
    __DEV__ && console.log('sendPong', data.toString())
    this.frameSender.encodePongFrame(data, this.sendFrameMaskType)
    return this.frameSender.sendEncodedFrame(this.socket)
  }

  receivePong () {
    this.pingTimeoutToken && clearTimeout(this.pingTimeoutToken)
    this.pingTimeoutToken = null
    this.pongTimeoutToken && clearTimeout(this.pongTimeoutToken)
    this.pongTimeoutToken = null
  }

  setFrameLengthLimit (frameLengthLimit) {
    if (__DEV__ && !Number.isInteger(frameLengthLimit)) throw new Error(`[setFrameLengthLimit] error value: ${frameLengthLimit}`)
    this.frameSender.frameLengthLimit = frameLengthLimit
    this.frameReceiver.frameLengthLimit = frameLengthLimit
    this.frameLengthLimit = frameLengthLimit
  }
}

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
    if (this.readyState !== WebSocketServer.CONNECTING) throw new Error(`[WebSocketServer][doUpgradeSocket] error readyState ${this.readyState}`)
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
    this.readyState = WebSocketServer.OPEN
    this.emit(WEB_SOCKET_EVENT_MAP.OPEN, this)
  }
}

class WebSocketClient extends WebSocketBase {
  static VALID_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
  static SECURE_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])
  static DEFAULT_ON_UPGRADE_RESPONSE = (webSocket, response, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket
  static buildUpgradeRequest (url, { key, isSecure, headers, origin = '', requestProtocolString = '' }) {
    const requestKey = key || getRequestKey()
    const responseKey = getRespondKey(requestKey)
    const requestOption = {
      ...urlToOption(url),
      protocol: undefined, // node do not use 'ws/wss', will use auto set 'http/https' instead
      port: url.port !== '' ? url.port : (isSecure ? 443 : 80),
      headers: {
        ...headers,
        origin,
        'upgrade': 'websocket',
        'connection': 'upgrade',
        'sec-websocket-version': WEB_SOCKET_VERSION,
        'sec-websocket-key': requestKey,
        'sec-websocket-protocol': requestProtocolString
      }
    }
    return { requestOption, requestProtocolString, responseKey }
  }

  constructor (socket, frameLengthLimit) {
    super(socket, frameLengthLimit)

    this.sendFrameMaskType = DO_MASK_DATA
  }

  doUpgradeSocket (response, requestProtocolString, responseKey) {
    if (this.readyState !== WebSocketServer.CONNECTING) throw new Error(`[WebSocketClient][doUpgradeSocket] error readyState ${this.readyState}`)
    if (responseKey !== response.headers[ 'sec-websocket-accept' ]) throw new Error('[WebSocketClient][doUpgradeSocket] wrong sec-websocket-accept')
    const protocol = response.headers[ 'sec-websocket-protocol' ]
    if (!requestProtocolString.split(/, */).includes(protocol)) throw new Error(`[WebSocketClient][doUpgradeSocket] unexpected protocol ${protocol}`)
    this.socket.on('error', this.close)
    this.socket.on('end', this.close)
    __DEV__ && console.log('[WebSocketClient][doUpgradeSocket]', responseKey)
    this.frameReceiver.listenAndReceiveFrame(
      this.socket,
      this.onReceiveFrame,
      (error) => this.close(1006, __DEV__ ? `Frame Error: ${error.message}` : 'Frame Error')
    )
    this.protocol = protocol
    this.readyState = WebSocketServer.OPEN
    this.emit(WEB_SOCKET_EVENT_MAP.OPEN, this)
  }
}

export {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,

  WebSocketServer,
  WebSocketClient
}
