import { createEventEmitter } from 'source/common/module/Event'
import { FRAME_CONFIG, OPCODE_TYPE, WEBSOCKET_EVENT } from './function'
import {
  createFrameSenderStore,
  encodeFrame,
  encodeCloseFrame,
  encodePingFrame,
  encodePongFrame,
  sendEncodedFrame
} from './frameSender'

import {
  createFrameReceiverStore,
  listenAndReceiveFrame
} from './frameReceiver'

const WEBSOCKET_PING_PONG_TIMEOUT = __DEV__ ? 5 * 1000 : 60 * 1000 // in msec, 60sec
const WEBSOCKET_CLOSE_TIMEOUT = __DEV__ ? 0.5 * 1000 : 5 * 1000 // in msec, 5sec

const DEFAULT_FRAME_LENGTH_LIMIT = 8 * 1024 * 1024 // 8 MiB

const NULL_ERROR_LISTENER = (error) => { __DEV__ && error && console.log('[NULL_ERROR_LISTENER] get error', error) }

const DEFAULT_BUFFER = Buffer.from('Dr')

const CONNECTING = 0 // The connection is not yet open.
const OPEN = 1 // The connection is open and ready to communicate.
const CLOSING = 2 // The connection is in the process of closing.
const CLOSED = 3 // The connection is closed or couldn't be opened.

const createWebSocket = ({
  socket,
  frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT,
  isMask = false, // default only for client to server, to prevent proxy mistaken binary data as http or other protocol
  shouldPing = false // default for server to start active ping
}) => {
  const eventEmitter = createEventEmitter()
  const frameSenderStore = createFrameSenderStore(frameLengthLimit)
  const frameReceiverStore = createFrameReceiverStore(frameLengthLimit)

  let closeTimeoutToken = null
  let pingTimeoutToken = null
  let pongTimeoutToken = null

  // should be public
  let readyState = CONNECTING // TODO: NOTE: browser WebSocket can directly read readyState

  const isOpen = () => (readyState === OPEN && socket && socket.writable)
  const isClosed = () => (readyState === CLOSED || !socket || socket.destroyed)

  const doCloseSocket = (error) => {
    __DEV__ && error && console.log('[doCloseSocket] get error', error)

    if (readyState === CLOSED) return
    __DEV__ && console.log('[WebSocket] doCloseSocket')

    readyState === CONNECTING && socket.writable && socket.write([
      'HTTP/1.1 400 Bad Request',
      'connection: close',
      '\r\n'
    ].join('\r\n'))
    readyState = CLOSED

    closeTimeoutToken && clearTimeout(closeTimeoutToken)
    pingTimeoutToken && clearTimeout(pingTimeoutToken)
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    closeTimeoutToken = null
    pingTimeoutToken = null
    pongTimeoutToken = null

    frameSenderStore.dispose()
    frameReceiverStore.dispose()

    socket.off('error', close)
    // socket.off('close', close) // TODO: check
    socket.off('end', close)
    socket.on('error', NULL_ERROR_LISTENER)
    socket.destroyed || socket.destroy()

    eventEmitter.emit(WEBSOCKET_EVENT.CLOSE) // TODO: remove all listeners also?
  }

  let frameDataType = null
  let frameBufferList = []
  let frameBufferLength = 0
  const queueCompleteFrame = (frame) => {
    if (!frameDataType) frameDataType = frame.dataType
    frameBufferList.push(frame.dataBuffer)
    frameBufferLength += frame.dataBuffer.length
    if (frameBufferLength > frameLengthLimit) throw new Error(`frameBufferList length ${frameBufferLength} exceeds limit: ${frameLengthLimit}`)

    __DEV__ && !frame.isFIN && console.log('[WebSocket] need more frame', frameBufferList.length, frameBufferLength)
    if (!frame.isFIN) return null// has more frames

    __DEV__ && console.log('[WebSocket] got one complete frame', frameBufferList.length, frameBufferLength)
    const dataType = frameDataType
    const dataBuffer = frameBufferList.length === 1 ? frameBufferList[ 0 ] : Buffer.concat(frameBufferList, frameBufferLength)
    frameDataType = null
    frameBufferList = []
    frameBufferLength = 0

    __DEV__ && console.log('[WebSocket] emit one complete frame')
    return { dataType, dataBuffer }
  }

  const onReceiveFrame = (frame) => { // { isFIN, dataType, dataBuffer, dataBufferLength }
    switch (frame.dataType) {
      case OPCODE_TYPE.CLOSE: {
        const code = (frame.dataBufferLength >= 2 && frame.dataBuffer.readUInt16BE(0)) || 1000
        const reason = (frame.dataBufferLength >= 3 && String(frame.dataBuffer.slice(2, frame.dataBufferLength))) || ''
        __DEV__ && console.log('[WebSocket] onReceiveFrame CLOSE', { code, reason })
        return close(code, reason)
      }
      case OPCODE_TYPE.PING:
        __DEV__ && console.log('[WebSocket] onReceiveFrame PING', frame.dataBuffer)
        return sendPong(frame.dataBuffer)
      case OPCODE_TYPE.PONG:
        __DEV__ && console.log('[WebSocket] onReceiveFrame PONG')
        return receivePong()
    }
    __DEV__ && console.log('[WebSocket] onReceiveFrame', frame.dataType)
    const completeFrameData = queueCompleteFrame(frame)
    completeFrameData && eventEmitter.emit(WEBSOCKET_EVENT.FRAME, completeFrameData)
    shouldPing && setNextPing() // [SERVER] delay next ping
  }

  const open = () => {
    socket.on('error', close)
    // socket.on('close', close) // TODO: check
    socket.on('end', close)
    listenAndReceiveFrame(
      frameReceiverStore,
      socket,
      onReceiveFrame,
      (error) => close(1006, __DEV__ ? `Frame Error: ${error.message}` : 'Frame Error')
    )
    readyState = OPEN
    eventEmitter.emit(WEBSOCKET_EVENT.OPEN)
  }

  const close = (code = 1000, reason = '') => {
    // __DEV__ && console.log('[WebSocket] want to close', { code, reason })
    if (__DEV__ && readyState === CLOSED) console.log('[WebSocket][close] close ignored, readyState is already CLOSED')
    if (readyState === CLOSED) return
    if (__DEV__ && readyState === CLOSING) console.log('[WebSocket][close] directly doCloseSocket, readyState is CLOSING')
    if (readyState === CLOSING) return doCloseSocket() // exchanged close frame
    if (readyState !== OPEN && readyState !== CLOSING) throw new Error(`error readyState = ${readyState}`)
    __DEV__ && console.log('[WebSocket][close] send close frame', { code, reason })
    readyState = CLOSING
    closeTimeoutToken = setTimeout(doCloseSocket, WEBSOCKET_CLOSE_TIMEOUT)
    encodeCloseFrame(frameSenderStore, code, reason, isMask)
    if (code === 1000) sendEncodedFrame(frameSenderStore, socket).catch(doCloseSocket)
    else sendEncodedFrame(frameSenderStore, socket).then(doCloseSocket, doCloseSocket) // close faster on error
  }

  const sendText = (text) => {
    if (readyState !== OPEN) throw new Error(`not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendText', text.slice(0, 20))
    encodeFrame(frameSenderStore, FRAME_CONFIG.COMPLETE, OPCODE_TYPE.TEXT, Buffer.from(text), isMask)
    return sendEncodedFrame(frameSenderStore, socket)
  }

  const sendBuffer = (buffer) => {
    if (readyState !== OPEN) throw new Error(`not open yet: readyState = ${readyState}`)
    __DEV__ && console.log('sendBuffer', buffer.length)
    encodeFrame(frameSenderStore, FRAME_CONFIG.COMPLETE, OPCODE_TYPE.BINARY, buffer, isMask)
    return sendEncodedFrame(frameSenderStore, socket)
  }

  // requestSendMultiFrameText () { } // TODO: add, or auto split when `sendText`?
  // requestSendMultiFrameBuffer () { } // TODO: add, or auto split when `sendBuffer`?

  const setNextPing = () => {
    pingTimeoutToken && clearTimeout(pingTimeoutToken)
    pingTimeoutToken = setTimeout(sendPing, WEBSOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPing')
  }

  const setNextPong = () => {
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    pongTimeoutToken = setTimeout(() => close(1006, 'pong timeout'), WEBSOCKET_PING_PONG_TIMEOUT)
    __DEV__ && console.log('setNextPong')
  }

  const sendPing = (dataBuffer = DEFAULT_BUFFER) => {
    if (readyState !== OPEN) return
    __DEV__ && console.log('sendPing', String(dataBuffer))
    setNextPong()
    encodePingFrame(frameSenderStore, dataBuffer, isMask)
    return sendEncodedFrame(frameSenderStore, socket)
  }

  const sendPong = (dataBuffer = DEFAULT_BUFFER) => {
    if (readyState !== OPEN) return
    __DEV__ && console.log('sendPong', String(dataBuffer))
    encodePongFrame(frameSenderStore, dataBuffer, isMask)
    return sendEncodedFrame(frameSenderStore, socket)
  }

  const receivePong = () => { // TODO: should check pong dataBuffer equal to ping
    pongTimeoutToken && clearTimeout(pongTimeoutToken)
    pongTimeoutToken = null // TODO: try `timeout.refresh()` // https://nodejs.org/api/timers.html#timers_timeout_refresh
    if (shouldPing) setNextPing()
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
    isMask,

    getReadyState: () => readyState,

    isOpen, isClosed,
    doCloseSocket,
    open,
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
