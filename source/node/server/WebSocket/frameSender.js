import { randomBytes } from 'crypto'

import { FRAME_CONFIG, OPCODE_TYPE, BUFFER_MAX_LENGTH, applyMaskQuadletBufferInPlace } from './function'

const DEFAULT_MASK_QUADLET_BUFFER = Buffer.alloc(4)

const NULL_ERROR = (error) => { __DEV__ && error && console.log('[NULL_ERROR] get error', error) }

const createFrameSenderStore = (frameLengthLimit) => {
  let promiseTail = Promise.resolve('HEAD') // used to coordinate send and receive
  return {
    dispose: () => {
      promiseTail.then(NULL_ERROR, NULL_ERROR)
      promiseTail = null
    },
    queuePromise: (resolve, reject) => (promiseTail = promiseTail.then(resolve, reject)),
    encodedFrameHeaderBuffer: null,
    encodedFrameDataBuffer: null,
    frameLengthLimit
  }
}

// frameTypeConfig: COMPLETE/FIRST
// dataType: TEXT/BINARY/CLOSE/PING/PONG
// data: Buffer for either text or binary, will be re-written for masking
const encodeFrame = (frameSenderStore, frameTypeConfig, dataType, dataBuffer, isMask) => {
  const [ quadbitFIN, quadbitOpcodeMask ] = frameTypeConfig
  const { length } = dataBuffer
  const initialOctet = (quadbitFIN << 4) | (dataType & quadbitOpcodeMask)

  let maskLengthOctet, extendLengthOctetCount
  if (length <= 125) {
    maskLengthOctet = length
    extendLengthOctetCount = 0
  } else if (length <= 65535) {
    maskLengthOctet = 126
    extendLengthOctetCount = 2
  } else if (length <= BUFFER_MAX_LENGTH) { // though max length limit is Math.pow(2, 63) octets
    maskLengthOctet = 127
    extendLengthOctetCount = 8
  } else throw new Error('dataBuffer length too big')

  if (length > frameSenderStore.frameLengthLimit) throw new Error(`dataBuffer length ${length} exceeds limit: ${frameSenderStore.frameLengthLimit}`)

  const maskOctetCount = isMask ? 4 : 0
  const maskQuadletBuffer = (isMask && length) ? randomBytes(4) : DEFAULT_MASK_QUADLET_BUFFER // 4octets | 32bits
  if (isMask) maskLengthOctet |= 0b10000000

  frameSenderStore.encodedFrameHeaderBuffer = Buffer.allocUnsafe(2 + extendLengthOctetCount + maskOctetCount) // 2-14octets | 16-112bits
  frameSenderStore.encodedFrameHeaderBuffer.writeUInt16BE((initialOctet << 8) | maskLengthOctet, 0, !__DEV__) // FIN_BIT/RSV/OPCODE/MASK_BIT/LENGTH [2octets]
  extendLengthOctetCount === 2 && frameSenderStore.encodedFrameHeaderBuffer.writeUInt16BE(length, 2, !__DEV__) // EXTEND LENGTH [2octets]
  extendLengthOctetCount === 8 && frameSenderStore.encodedFrameHeaderBuffer.writeUInt32BE(0, 2, !__DEV__) // EXTEND LENGTH [4 of 8octets] // NOTE: can't use in node with buffer.constants.MAX_LENGTH
  extendLengthOctetCount === 8 && frameSenderStore.encodedFrameHeaderBuffer.writeUInt32BE(length, 6, !__DEV__) // EXTEND LENGTH [4 of 8octets]
  isMask && maskQuadletBuffer.copy(frameSenderStore.encodedFrameHeaderBuffer, 2 + extendLengthOctetCount) // MASK [4octets]

  frameSenderStore.encodedFrameDataBuffer = dataBuffer
  isMask && length && applyMaskQuadletBufferInPlace(frameSenderStore.encodedFrameDataBuffer, maskQuadletBuffer)
}

const encodeCloseFrame = (frameSenderStore, code = 1000, reason = '', isMask) => {
  const stringLength = Buffer.byteLength(reason)
  const dataBuffer = Buffer.allocUnsafe(2 + stringLength)
  dataBuffer.writeUInt16BE(code, 0, !__DEV__)
  dataBuffer.write(reason, 2, stringLength)
  // __DEV__ && console.log('encodeCloseFrame', { code, reason, stringLength })
  encodeFrame(frameSenderStore, FRAME_CONFIG.COMPLETE, OPCODE_TYPE.CLOSE, dataBuffer, isMask)
}
const encodePingFrame = (frameSenderStore, dataBuffer, isMask) => encodeFrame(frameSenderStore, FRAME_CONFIG.COMPLETE, OPCODE_TYPE.PING, dataBuffer, isMask)
const encodePongFrame = (frameSenderStore, dataBuffer, isMask) => encodeFrame(frameSenderStore, FRAME_CONFIG.COMPLETE, OPCODE_TYPE.PONG, dataBuffer, isMask)

const sendEncodedFrame = (frameSenderStore, socket) => { // will send the frame just encoded
  __DEV__ && console.log('[Frame] sendEncodedFrame', frameSenderStore.encodedFrameHeaderBuffer, '|', frameSenderStore.encodedFrameDataBuffer)
  const frameHeaderBuffer = frameSenderStore.encodedFrameHeaderBuffer
  const frameDataBuffer = frameSenderStore.encodedFrameDataBuffer
  frameSenderStore.encodedFrameHeaderBuffer = null
  frameSenderStore.encodedFrameDataBuffer = null
  return frameSenderStore.queuePromise(() => new Promise((resolve, reject) => {
    __DEV__ && console.log('[Frame] sendEncodedFrame send')
    const onDataSend = () => {
      __DEV__ && console.log('[Frame] sendEncodedFrame send finish')
      socket.off('error', reject)
      resolve()
    }
    socket.on('error', reject)
    if (frameDataBuffer.length === 0) socket.write(frameHeaderBuffer, onDataSend)
    else {
      socket.write(frameHeaderBuffer)
      socket.write(frameDataBuffer, onDataSend)
    }
  }))
}

export {
  createFrameSenderStore,

  encodeFrame,
  encodeCloseFrame,
  encodePingFrame,
  encodePongFrame,
  sendEncodedFrame
}
