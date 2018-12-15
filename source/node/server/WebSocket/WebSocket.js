import { createEventEmitter } from 'source/common/module/Event'
import { FRAME_TYPE_CONFIG_MAP, DATA_TYPE_MAP, WEB_SOCKET_EVENT_MAP } from './type'
import { createFrameSender, createFrameReceiver } from './Frame'

const WEB_SOCKET_PING_PONG_TIMEOUT = __DEV__ ? 5 * 1000 : 60 * 1000 // in msec, 60sec
const WEB_SOCKET_CLOSE_TIMEOUT = __DEV__ ? 0.5 * 1000 : 5 * 1000 // in msec, 5sec

const NULL_ERROR_LISTENER = (error) => { __DEV__ && error && console.log('[NULL_ERROR_LISTENER] get error', error) }

const DEFAULT_BUFFER = Buffer.from('Dr')

const CONNECTING = 0 // The connection is not yet open.
const OPEN = 1 // The connection is open and ready to communicate.
const CLOSING = 2 // The connection is in the process of closing.
const CLOSED = 3 // The connection is closed or couldn't be opened.

const createWebSocket = ({
  socket,
  frameLengthLimit,
  sendFrameMaskType, // DO_MASK_DATA | DO_NOT_MASK_DATA
  shouldActivePing = false // for server
}) => {
  const eventEmitter = createEventEmitter()
  const frameSender = createFrameSender(frameLengthLimit)
  const frameReceiver = createFrameReceiver(frameLengthLimit)

  let closeTimeoutToken = null
  let pingTimeoutToken = null
  let pongTimeoutToken = null

  // should be public
  let readyState = CONNECTING // TODO: NOTE: browser WebSocket can directly read readyState
  const getReadyState = () => readyState
  const setReadyState = (nextReadyState) => { readyState = nextReadyState }

  const setFrameLengthLimit = (nextFrameLengthLimit) => {
    if (__DEV__ && !Number.isInteger(nextFrameLengthLimit)) throw new Error(`[setFrameLengthLimit] error value: ${nextFrameLengthLimit}`)
    frameSender.setFrameLengthLimit(nextFrameLengthLimit)
    frameReceiver.setFrameLengthLimit(nextFrameLengthLimit)
    frameLengthLimit = nextFrameLengthLimit
  }

  const isClosed = () => (readyState === CLOSED || !socket || socket.destroyed)

  const doCloseSocket = (error) => {
    __DEV__ && error && console.log('[doCloseSocket] get error', error)

    if (readyState === CLOSED) return
    __DEV__ && console.log('[WebSocket] doCloseSocket')

    // TODO: HACK: socket.writable not in Official API, check: https://github.com/websockets/ws/blob/master/lib/websocket-server.js#L354
    readyState === CONNECTING && socket.writable && socket.write('HTTP/1.1 400 Bad Request\r\nconnection: close\r\n\r\n')
    readyState = CLOSED

    closeTimeoutToken && clearTimeout(closeTimeoutToken)
    pingTimeoutToken && clearTimeout(pingTimeoutToken)
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    closeTimeoutToken = null
    pingTimeoutToken = null
    pongTimeoutToken = null

    frameSender.queuePromise(NULL_ERROR_LISTENER, NULL_ERROR_LISTENER)
    frameReceiver.queuePromise(NULL_ERROR_LISTENER, NULL_ERROR_LISTENER)
    frameSender.clear()
    frameReceiver.clear()

    socket.removeListener('error', close)
    socket.removeListener('end', close)
    socket.on('error', NULL_ERROR_LISTENER)
    socket.destroyed || socket.destroy()

    eventEmitter.emit(WEB_SOCKET_EVENT_MAP.CLOSE) // TODO: remove all listeners also?
  }

  let frameDataType = null
  let frameBufferList = []
  let frameBufferLength = 0
  const queueCompleteFrame = (frame) => {
    if (!frameDataType) frameDataType = frame.dataType
    frameBufferList.push(frame.dataBuffer)
    frameBufferLength += frame.dataBuffer.length
    if (frameBufferLength > frameLengthLimit) throw new Error(`[WebSocket] frameBufferList length ${frameBufferLength} exceeds limit: ${frameLengthLimit}`)

    __DEV__ && !frame.isFIN && console.log('[WebSocket] need more frame', frameBufferList.length, frameBufferLength)
    if (!frame.isFIN) return null// has more frames

    __DEV__ && console.log('[WebSocket] got one complete frame', frameBufferList.length, frameBufferLength)
    const dataType = frameDataType
    const dataBuffer = frameBufferList.length === 1 ? frameBufferList[ 0 ] : Buffer.concat(frameBufferList, frameBufferLength)
    frameDataType = null
    frameBufferList = []
    frameBufferLength = 0

    // __DEV__ && console.log('[WebSocket] emit one complete frame')
    return { dataType, dataBuffer }
  }

  const onReceiveFrame = (frame) => { // { isFIN, dataType, dataBuffer, dataBufferLength }
    switch (frame.dataType) {
      case DATA_TYPE_MAP.OPCODE_CLOSE: {
        const code = (frame.dataBufferLength >= 2 && frame.dataBuffer.readUInt16BE(0, !__DEV__)) || 1000
        const reason = (frame.dataBufferLength >= 3 && frame.dataBuffer.slice(2, frame.dataBufferLength).toString()) || ''
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_CLOSE', { code, reason })
        return close(code, reason)
      }
      case DATA_TYPE_MAP.OPCODE_PING:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PING', frame.dataBuffer)
        return sendPong(frame.dataBuffer)
      case DATA_TYPE_MAP.OPCODE_PONG:
        __DEV__ && console.log('[WebSocket] onReceiveFrame OPCODE_PONG')
        return receivePong()
    }
    __DEV__ && console.log('[WebSocket] onReceiveFrame', frame.dataType)
    const completeFrameData = queueCompleteFrame(frame)
    completeFrameData && eventEmitter.emit(WEB_SOCKET_EVENT_MAP.FRAME, completeFrameData)
    shouldActivePing && setNextPing() // [SERVER] delay next ping
  }

  const listenAndReceiveFrame = () => frameReceiver.listenAndReceiveFrame(
    socket,
    onReceiveFrame,
    (error) => close(1006, __DEV__ ? `Frame Error: ${error.message}` : 'Frame Error')
  )

  const close = (code = 1000, reason = '') => {
    // __DEV__ && console.log('[WebSocket] want to close', { code, reason })
    if (__DEV__ && readyState === CLOSED) console.log('[WebSocket][close] close ignored, readyState is already CLOSED')
    if (readyState === CLOSED) return
    if (__DEV__ && readyState === CLOSING) console.log('[WebSocket][close] directly doCloseSocket, readyState is CLOSING')
    if (readyState === CLOSING) return doCloseSocket() // exchanged close frame
    if (readyState !== OPEN && readyState !== CLOSING) throw new Error(`[close] error readyState = ${readyState}`)
    __DEV__ && console.log('[WebSocket][close] send close frame', { code, reason })
    readyState = CLOSING
    closeTimeoutToken = setTimeout(doCloseSocket, WEB_SOCKET_CLOSE_TIMEOUT)
    frameSender.encodeCloseFrame(code, reason, sendFrameMaskType)
    if (code === 1000) frameSender.sendEncodedFrame(socket).catch(doCloseSocket)
    else frameSender.sendEncodedFrame(socket).then(doCloseSocket, doCloseSocket) // close faster on error
  }

  const sendText = (text) => {
    if (readyState !== OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendText', text.slice(0, 20))
    frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_TEXT, Buffer.from(text), sendFrameMaskType)
    return frameSender.sendEncodedFrame(socket)
  }

  const sendBuffer = (buffer) => {
    if (readyState !== OPEN) throw new Error(`[sendBuffer] not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendBuffer', buffer.length)
    frameSender.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_BINARY, buffer, sendFrameMaskType)
    return frameSender.sendEncodedFrame(socket)
  }

  // requestSendMultiFrameText () { } // TODO:
  // requestSendMultiFrameBuffer () { } // TODO:

  const setNextPing = () => {
    pingTimeoutToken && clearTimeout(pingTimeoutToken)
    pingTimeoutToken = setTimeout(sendPing, WEB_SOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPing')
  }

  const setNextPong = () => {
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    pongTimeoutToken = setTimeout(() => close(1006, 'pong timeout'), WEB_SOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPong')
  }

  const sendPing = (dataBuffer = DEFAULT_BUFFER) => {
    if (readyState !== OPEN) return
    __DEV__ && console.log('sendPing', dataBuffer.toString())
    setNextPong()
    frameSender.encodePingFrame(dataBuffer, sendFrameMaskType)
    return frameSender.sendEncodedFrame(socket)
  }

  const sendPong = (dataBuffer = DEFAULT_BUFFER) => {
    if (readyState !== OPEN) return
    __DEV__ && console.log('sendPong', dataBuffer.toString())
    frameSender.encodePongFrame(dataBuffer, sendFrameMaskType)
    return frameSender.sendEncodedFrame(socket)
  }

  const receivePong = () => { // TODO: should check pong dataBuffer equal to ping
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    pongTimeoutToken = null
    if (shouldActivePing) setNextPing()
    else {
      pingTimeoutToken && clearTimeout(pingTimeoutToken)
      pingTimeoutToken = null
    }
  }

  return {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED,

    ...eventEmitter,

    socket,
    frameLengthLimit,
    sendFrameMaskType,

    getReadyState,
    setReadyState,
    setFrameLengthLimit,

    isClosed,
    doCloseSocket,
    listenAndReceiveFrame,
    close,
    sendText,
    sendBuffer,
    setNextPing,
    setNextPong,
    sendPing,
    sendPong
  }
}

export { createWebSocket }
