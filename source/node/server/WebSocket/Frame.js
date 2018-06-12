import { randomBytes } from 'crypto'
import { constants as bufferConstants } from 'buffer'

import {
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  DO_MASK_DATA,
  DEFAULT_FRAME_LENGTH_LIMIT
} from './type'

const BUFFER_MAX_LENGTH = bufferConstants.MAX_LENGTH // max at (2^31) - 1, less than Number.MAX_SAFE_INTEGER at (2^53) - 1

const POW_2_32 = Math.pow(2, 32)

const DEFAULT_MASK_QUADLET_BUFFER = Buffer.alloc(4)

const createFrameSender = (frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT) => {
  let encodedFrameHeaderBuffer, encodedFrameDataBuffer, promiseTail
  const clear = () => {
    encodedFrameHeaderBuffer = null
    encodedFrameDataBuffer = null
    promiseTail = Promise.resolve('HEAD') // used to coordinate send and receive
  }
  clear()

  const setFrameLengthLimit = (nextFrameLengthLimit) => { frameLengthLimit = nextFrameLengthLimit }

  const queuePromise = (onFulfilled, onRejected) => (promiseTail = promiseTail.then(onFulfilled, onRejected))

  // frameTypeConfig: FRAME_COMPLETE/FRAME_FIRST
  // dataType: OPCODE_TEXT/OPCODE_BINARY/OPCODE_CLOSE/OPCODE_PING/OPCODE_PONG
  // data: Buffer for either text or binary, will be re-written for masking
  const encodeFrame = (frameTypeConfig, dataType, dataBuffer, maskType) => {
    const { FINQuadBit, opcodeQuadBitMask } = frameTypeConfig
    const { length } = dataBuffer
    const initialOctet = (FINQuadBit << 4) | (dataType & opcodeQuadBitMask)

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
    } else throw new Error('[encodeFrame] dataBuffer length exceeds BUFFER_MAX_LENGTH')

    if (length > frameLengthLimit) throw new Error(`[encodeFrame] dataBuffer length ${length} exceeds limit: ${frameLengthLimit}`)

    const isMask = (maskType === DO_MASK_DATA)
    const maskOctetCount = isMask ? 4 : 0
    const maskQuadletBuffer = (isMask && length) ? randomBytes(4) : DEFAULT_MASK_QUADLET_BUFFER // 4octets | 32bits
    if (isMask) maskLengthOctet |= 0b10000000

    encodedFrameHeaderBuffer = Buffer.allocUnsafe(2 + extendLengthOctetCount + maskOctetCount) // 2-14octets | 16-112bits
    encodedFrameHeaderBuffer.writeUInt16BE((initialOctet << 8) | maskLengthOctet, 0, !__DEV__) // FIN_BIT/RSV/OPCODE/MASK_BIT/LENGTH [2octets]
    extendLengthOctetCount === 2 && encodedFrameHeaderBuffer.writeUInt16BE(length, 2, !__DEV__) // EXTEND LENGTH [2octets]
    extendLengthOctetCount === 8 && encodedFrameHeaderBuffer.writeUInt32BE(0, 2, !__DEV__) // EXTEND LENGTH [4 of 8octets] // NOTE: can't use in node with buffer.constants.MAX_LENGTH
    extendLengthOctetCount === 8 && encodedFrameHeaderBuffer.writeUInt32BE(length, 6, !__DEV__) // EXTEND LENGTH [4 of 8octets]
    isMask && maskQuadletBuffer.copy(encodedFrameHeaderBuffer, 2 + extendLengthOctetCount) // MASK [4octets]

    encodedFrameDataBuffer = dataBuffer
    isMask && length && applyBufferMaskQuadlet(encodedFrameDataBuffer, maskQuadletBuffer)
  }

  const encodeCloseFrame = (code = 1000, reason = '', maskType) => {
    const stringLength = Buffer.byteLength(reason)
    const dataBuffer = Buffer.allocUnsafe(2 + stringLength)
    dataBuffer.writeUInt16BE(code, 0, !__DEV__)
    dataBuffer.write(reason, 2, stringLength)
    // __DEV__ && console.log('encodeCloseFrame', { code, reason, stringLength })
    encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_CLOSE, dataBuffer, maskType)
  }
  const encodePingFrame = (data = '', maskType) => encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_PING, Buffer.from(data), maskType)
  const encodePongFrame = (data = '', maskType) => encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_PONG, Buffer.from(data), maskType)

  const sendEncodedFrame = (socket) => { // will send the frame just encoded
    __DEV__ && console.log('[Frame] sendEncodedFrame', encodedFrameHeaderBuffer, '|', encodedFrameDataBuffer)
    const frameHeaderBuffer = encodedFrameHeaderBuffer
    const frameDataBuffer = encodedFrameDataBuffer
    encodedFrameHeaderBuffer = null
    encodedFrameDataBuffer = null
    return queuePromise(() => new Promise((resolve, reject) => {
      // __DEV__ && console.log('[Frame] sendEncodedFrame send')
      const onDataSend = () => {
        // __DEV__ && console.log('[Frame] sendEncodedFrame send finish')
        socket.removeListener('error', reject)
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

  return {
    clear,
    setFrameLengthLimit,
    queuePromise,
    encodeFrame,
    encodeCloseFrame,
    encodePingFrame,
    encodePongFrame,
    sendEncodedFrame
  }
}

const DECODE_STAGE_INITIAL_OCTET = 0
const DECODE_STAGE_EXTEND_DATA_LENGTH_2 = 1
const DECODE_STAGE_EXTEND_DATA_LENGTH_8 = 2
const DECODE_STAGE_MASK_QUADLET = 3
const DECODE_STAGE_DATA_BUFFER = 4
const DECODE_STAGE_END_FRAME = 5

const createFrameReceiver = (frameLengthLimit) => {
  let doClearSocketListener, promiseTail
  const clear = () => {
    if (doClearSocketListener) doClearSocketListener()
    doClearSocketListener = null
    promiseTail = Promise.resolve('HEAD') // used to coordinate send and receive
  }
  clear()

  const setFrameLengthLimit = (nextFrameLengthLimit) => { frameLengthLimit = nextFrameLengthLimit }

  const queuePromise = (onFulfilled, onRejected) => (promiseTail = promiseTail.then(onFulfilled, onRejected))

  const listenAndReceiveFrame = (socket, onFrame, onError = clear) => {
    const { pushChunkDataBuffer, decode, resetDecode, getDecodeFrame } = createFrameDecoder(frameLengthLimit)

    let receiveResolve = null
    let receiveReject = null
    const resetReceive = () => {
      // __DEV__ && console.log('[Frame] resetReceive')
      receiveReject && socket.removeListener('error', receiveReject)
      receiveResolve = null
      receiveReject = null
      resetDecode()
    }

    const onPromiseReject = (error) => {
      resetReceive()
      onError(error)
    }

    const promiseReceive = () => {
      if (receiveResolve) return
      // __DEV__ && console.log('[Frame] onSocketData first chunk')
      // HACK: first pick out resolve to delay Promise resolve
      const receivePromise = new Promise((resolve, reject) => {
        socket.on('error', reject)
        receiveResolve = resolve
        receiveReject = reject
      })
      queuePromise(() => receivePromise.then(onFrame), onPromiseReject)
    }

    const onSocketData = (chunk) => {
      __DEV__ && console.log(`[Frame] checkReceive +${chunk.length}`)
      promiseReceive()
      pushChunkDataBuffer(chunk)
      while (decode()) {
        const decodeFrame = getDecodeFrame()
        if (decodeFrame === null) continue
        // __DEV__ && console.log('[Frame] checkReceive got one frame', decodeFrame)
        receiveResolve(decodeFrame)
        resetReceive()
        promiseReceive()
      }
    }

    clear()
    socket.on('data', onSocketData)
    doClearSocketListener = () => {
      resetReceive()
      socket.removeListener('data', onSocketData)
    }
  }

  return {
    clear,
    setFrameLengthLimit,
    queuePromise,
    listenAndReceiveFrame
  }
}

const createChunkDataBuffer = () => {
  let chunkList = []
  let chunkListBufferLength = 0
  const pushChunkDataBuffer = (chunkDataBuffer) => {
    chunkList.push(chunkDataBuffer)
    chunkListBufferLength += chunkDataBuffer.length
  }
  const hasChunkDataBuffer = (length) => chunkListBufferLength >= length
  const getMergedChunkDataBuffer = (length = chunkListBufferLength) => {
    chunkListBufferLength -= length
    if (length === chunkList[ 0 ].length) return chunkList.shift() // fit size
    if (length < chunkList[ 0 ].length) { // a bigger chunk
      let chunkDataBuffer = chunkList[ 0 ].slice(0, length)
      chunkList[ 0 ] = chunkList[ 0 ].slice(length)
      return chunkDataBuffer
    }
    let mergeChunkDataBuffer = Buffer.allocUnsafe(length) // merge chunks
    let offset = 0
    while (length >= 1) {
      let chunkLength = chunkList[ 0 ].length
      if (length >= chunkLength) {
        chunkList[ 0 ].copy(mergeChunkDataBuffer, offset)
        offset += chunkLength
        chunkList.shift()
        length -= chunkLength
      } else {
        chunkList[ 0 ].copy(mergeChunkDataBuffer, offset, 0, length)
        chunkList[ 0 ] = chunkList[ 0 ].slice(length)
        length -= length
      }
    }
    return mergeChunkDataBuffer
  }

  return {
    pushChunkDataBuffer,
    hasChunkDataBuffer,
    getMergedChunkDataBuffer
  }
}

const createFrameDecoder = (frameLengthLimit) => {
  const { pushChunkDataBuffer, hasChunkDataBuffer, getMergedChunkDataBuffer } = createChunkDataBuffer()

  let decodeStage = DECODE_STAGE_INITIAL_OCTET
  let decodedFrameTypeConfig = null
  let decodedDataType = null
  let decodedIsMask = false
  let decodedMaskQuadletBuffer = null
  let decodedDataBuffer = null
  let decodedDataBufferLength = 0

  const decode = () => {
    // __DEV__ && console.log('decode', { decodeStage, chunkListBufferLength })
    switch (decodeStage) {
      case DECODE_STAGE_INITIAL_OCTET:
        if (hasChunkDataBuffer(2)) {
          const chunkDataBuffer = getMergedChunkDataBuffer(2)
          const initialQuadlet = chunkDataBuffer.readUInt16BE(0, !__DEV__)
          const FINQuadBit = (initialQuadlet >>> 12) & 0b1000
          const opcodeQuadBit = (initialQuadlet >>> 8) & 0b1111
          const initialLength = initialQuadlet & 0b01111111

          decodedFrameTypeConfig = FINQuadBit === 0b1000
            ? opcodeQuadBit === DATA_TYPE_MAP.OPCODE_CONTINUATION
              ? FRAME_TYPE_CONFIG_MAP.FRAME_LAST
              : FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE
            : opcodeQuadBit === DATA_TYPE_MAP.OPCODE_CONTINUATION
              ? FRAME_TYPE_CONFIG_MAP.FRAME_MORE
              : FRAME_TYPE_CONFIG_MAP.FRAME_FIRST
          decodedDataType = opcodeQuadBit
          decodedIsMask = ((initialQuadlet & 0b10000000) !== 0)

          if (initialLength === 0) {
            decodedDataBufferLength = 0
            decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_END_FRAME // complete, a 16bit frame
          } else if (initialLength <= 125) {
            decodedDataBufferLength = initialLength
            if (decodedDataBufferLength > frameLengthLimit) throw new Error(`[decode] dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
            decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
          } else if (initialLength === 126) decodeStage = DECODE_STAGE_EXTEND_DATA_LENGTH_2
          else decodeStage = DECODE_STAGE_EXTEND_DATA_LENGTH_8

          // __DEV__ && console.log('[DECODE_STAGE_INITIAL_OCTET]', { FINQuadBit, opcodeQuadBit, initialLength })
          return true
        }
        break
      case DECODE_STAGE_EXTEND_DATA_LENGTH_2:
        if (hasChunkDataBuffer(2)) {
          const chunkDataBuffer = getMergedChunkDataBuffer(2)
          decodedDataBufferLength = chunkDataBuffer.readUInt16BE(0, !__DEV__)
          if (decodedDataBufferLength > frameLengthLimit) throw new Error(`[decode] dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
          decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

          // __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_2]', { decodedDataBufferLength })
          return true
        }
        break
      case DECODE_STAGE_EXTEND_DATA_LENGTH_8:
        if (hasChunkDataBuffer(8)) {
          const chunkDataBuffer = getMergedChunkDataBuffer(8)
          decodedDataBufferLength = chunkDataBuffer.readUInt32BE(0, !__DEV__) * POW_2_32 + chunkDataBuffer.readUInt32BE(4, !__DEV__)
          if (decodedDataBufferLength > BUFFER_MAX_LENGTH) throw new Error('[decode] decodedDataBufferLength exceeds BUFFER_MAX_LENGTH')
          if (decodedDataBufferLength > frameLengthLimit) throw new Error(`[decode] dataBuffer length ${decodedDataBufferLength} exceeds limit: ${frameLengthLimit}`)
          decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

          // __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_8]', { decodedDataBufferLength })
          return true
        }
        break
      case DECODE_STAGE_MASK_QUADLET:
        if (hasChunkDataBuffer(4)) {
          decodedMaskQuadletBuffer = getMergedChunkDataBuffer(4)
          decodeStage = decodedDataBufferLength ? DECODE_STAGE_DATA_BUFFER : DECODE_STAGE_END_FRAME

          // __DEV__ && console.log('[DECODE_STAGE_MASK_QUADLET]', { decodedMaskQuadletBuffer })
          return true
        }
        break
      case DECODE_STAGE_DATA_BUFFER:
        if (hasChunkDataBuffer(decodedDataBufferLength)) {
          decodedDataBuffer = getMergedChunkDataBuffer(decodedDataBufferLength)
          decodedIsMask && applyBufferMaskQuadlet(decodedDataBuffer, decodedMaskQuadletBuffer)
          decodeStage = DECODE_STAGE_END_FRAME

          // __DEV__ && console.log('[DECODE_STAGE_DATA_BUFFER]', { decodedDataBuffer }, decodedDataBuffer.toString())
          return true
        }
        break
    }
    return false // no parse-able buffer
  }

  const resetDecode = () => {
    decodeStage = DECODE_STAGE_INITIAL_OCTET
    decodedFrameTypeConfig = null
    decodedDataType = null
    decodedIsMask = false
    decodedMaskQuadletBuffer = null
    decodedDataBuffer = null
    decodedDataBufferLength = 0
  }

  const getDecodeFrame = () => ((decodeStage !== DECODE_STAGE_END_FRAME) ? null : {
    isFIN: decodedFrameTypeConfig.FINQuadBit === 0b1000,
    dataType: decodedDataType,
    dataBuffer: decodedDataBuffer,
    dataBufferLength: decodedDataBufferLength
  })

  return {
    pushChunkDataBuffer,
    decode,
    resetDecode,
    getDecodeFrame
  }
}

// will change buffer
const applyBufferMaskQuadlet = (buffer, maskQuadletBuffer) => {
  for (let index = 0, indexMax = buffer.length; index < indexMax; index++) buffer[ index ] ^= maskQuadletBuffer[ index & 3 ]
}

export {
  createFrameSender,
  createFrameReceiver
}
