import { randomBytes } from 'crypto'

// Source: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
// Frame format:
//      0                   1                   2                   3
//      0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
//     +-+-+-+-+-------+-+-------------+-------------------------------+
//     |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
//     |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
//     |N|V|V|V|       |S|             |   (if payload len==126/127)   |
//     | |1|2|3|       |K|             |                               |
//     +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
//     |     Extended payload length continued, if payload len == 127  |
//     + - - - - - - - - - - - - - - - +-------------------------------+
//     |                               |Masking-key, if MASK set to 1  |
//     +-------------------------------+-------------------------------+
//     | Masking-key (continued)       |          Payload Data         |
//     +-------------------------------- - - - - - - - - - - - - - - - +
//     :                     Payload Data continued ...                :
//     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
//     |                     Payload Data continued ...                |
//     +---------------------------------------------------------------+

const BIT_0000 = 0x0
const BIT_0001 = 0x1
const BIT_0010 = 0x2
const BIT_1000 = 0x8
const BIT_1001 = 0x9
const BIT_1010 = 0xa
const BIT_1111 = 0xf
const BIT_1000_0000 = 0x80
const BIT_0111_1111 = 0x7f

// NOTE: these quadbit will also set RSV123 to 0, thus will ignore extension bits RSV1-3
const FRAME_TYPE_CONFIG_MAP = {
  FRAME_COMPLETE: { FINQuadBit: BIT_1000, opcodeQuadBitMask: BIT_1111 },
  FRAME_FIRST: { FINQuadBit: BIT_0000, opcodeQuadBitMask: BIT_1111 },
  FRAME_MORE: { FINQuadBit: BIT_0000, opcodeQuadBitMask: BIT_0000 },
  FRAME_LAST: { FINQuadBit: BIT_1000, opcodeQuadBitMask: BIT_0000 }
}

const DATA_TYPE_MAP = {
  OPCODE_CONTINUATION: BIT_0000,
  OPCODE_TEXT: BIT_0001,
  OPCODE_BINARY: BIT_0010,
  OPCODE_CLOSE: BIT_1000,
  OPCODE_PING: BIT_1001,
  OPCODE_PONG: BIT_1010
}

const DO_MASK_DATA = true
const DO_NOT_MASK_DATA = false

class FrameSender {
  constructor () {
    this.clear = this.clear.bind(this)
    this.clear()
  }

  clear () {
    this.encodedFrameHeaderBuffer = null
    this.encodedFrameDataBuffer = null

    this.promiseTail = Promise.resolve('HEAD') // used to coordinate send and recerive
  }

  queuePromise (onFulfilled, onRejected) {
    this.promiseTail = this.promiseTail.then(onFulfilled, onRejected)
    return this.promiseTail
  }

  // frameTypeConfig: FRAME_COMPLETE/FRAME_FIRST
  // dataType: OPCODE_TEXT/OPCODE_BINARY/OPCODE_CLOSE/OPCODE_PING/OPCODE_PONG
  // data: Buffer for either text or binary, will be re-written for masking
  encodeFrame (frameTypeConfig, dataType, dataBuffer, maskType) {
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
    } else { // though max length limit is Math.pow(2, 63) octets
      maskLengthOctet = 127
      extendLengthOctetCount = 6
    }

    const isMask = (maskType === DO_MASK_DATA)
    const maskOctetCount = isMask ? 4 : 0
    const maskQuadlet = isMask && randomBytes(4) // 4octets | 32bits
    if (isMask) maskLengthOctet = maskLengthOctet | BIT_1000_0000

    this.encodedFrameHeaderBuffer = Buffer.allocUnsafe(2 + extendLengthOctetCount + maskOctetCount) // 2-12octets | 16-96bits
    this.encodedFrameHeaderBuffer.writeUInt16BE((initialOctet << 8) | maskLengthOctet, 0, !__DEV__) // FIN_BIT/RSV/OPCODE/MASK_BIT/LENGTH [2octets]
    extendLengthOctetCount !== 0 && this.encodedFrameHeaderBuffer.writeUIntBE(length, 2, extendLengthOctetCount, !__DEV__) // EXTEND LENGTH [0/2/6octets]
    isMask && this.encodedFrameHeaderBuffer.writeUInt32BE(maskQuadlet, 2 + extendLengthOctetCount, !__DEV__) // MASK [4octets]

    this.encodedFrameDataBuffer = dataBuffer
    isMask && length && applyBufferMaskQuadlet(this.encodedFrameDataBuffer, maskQuadlet)
  }

  encodeCloseFrame (code = 1000, reason = '', maskType) {
    const dataBuffer = Buffer.allocUnsafe(2 + reason.length)
    dataBuffer.writeUInt16BE(code)
    dataBuffer.write(reason, 2, reason.length)
    return this.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_CLOSE, dataBuffer, maskType)
  }

  encodePingFrame (data = '', maskType) {
    return this.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_PING, Buffer.from(data), maskType)
  }

  encodePongFrame (data = '', maskType) {
    return this.encodeFrame(FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE, DATA_TYPE_MAP.OPCODE_PONG, Buffer.from(data), maskType)
  }

  sendEncodedFrame (socket) { // will send the frame just encoded
    __DEV__ && console.log('[Frame] sendEncodedFrame', this.encodedFrameHeaderBuffer.length, this.encodedFrameDataBuffer.length)
    const frameHeaderBuffer = this.encodedFrameHeaderBuffer
    const frameDataBuffer = this.encodedFrameDataBuffer
    this.encodedFrameHeaderBuffer = null
    this.encodedFrameDataBuffer = null
    return this.queuePromise(() => new Promise((resolve, reject) => {
      __DEV__ && console.log('[Frame] sendEncodedFrame send')
      socket.on('error', reject)
      socket.write(frameHeaderBuffer)
      socket.write(frameDataBuffer, () => {
        __DEV__ && console.log('[Frame] sendEncodedFrame send finish')
        socket.removeListener('error', reject)
        resolve()
      })
    }))
  }
}

const DECODE_STAGE_INITIAL_OCTET = 0
const DECODE_STAGE_EXTEND_DATA_LENGTH_2 = 1
const DECODE_STAGE_EXTEND_DATA_LENGTH_6 = 2
const DECODE_STAGE_MASK_QUADLET = 3
const DECODE_STAGE_DATA_BUFFER = 4
const DECODE_STAGE_END_FRAME = 5

class FrameReceiver {
  constructor () {
    this.clear = this.clear.bind(this)
    this.clear()
  }

  clear () {
    if (this.doClearSocketListener) this.doClearSocketListener()
    this.doClearSocketListener = null

    this.promiseTail = Promise.resolve('HEAD') // used to coordinate send and receive
  }

  queuePromise (onFulfilled, onRejected) {
    this.promiseTail = this.promiseTail.then(onFulfilled, onRejected)
    return this.promiseTail
  }

  listenAndReceiveFrame (socket, onFrame, onError = this.clear) {
    let chunkList = []
    let chunkListBufferLength = 0
    const pushChunkDataBuffer = (chunkDataBuffer) => {
      chunkList.push(chunkDataBuffer)
      chunkListBufferLength += chunkDataBuffer.length
    }
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

    let decodeStage = DECODE_STAGE_INITIAL_OCTET
    let decodedFrameTypeConfig = null
    let decodedDataType = null
    let decodedIsMask = false
    let decodedMaskQuadlet = null
    let decodedDataBuffer = null
    let decodedDataBufferLength = 0
    const decode = () => {
      switch (decodeStage) {
        case DECODE_STAGE_INITIAL_OCTET:
          if (chunkListBufferLength >= 2) {
            const chunkDataBuffer = getMergedChunkDataBuffer(2)
            const initialQuadlet = chunkDataBuffer.readUInt16BE(0, !__DEV__)
            const FINQuadBit = (initialQuadlet >>> 12) & BIT_1000
            const opcodeQuadBit = (initialQuadlet >>> 8) & BIT_1111
            const initialLength = initialQuadlet & BIT_0111_1111

            decodedFrameTypeConfig = FINQuadBit === BIT_1000
              ? opcodeQuadBit === DATA_TYPE_MAP.OPCODE_CONTINUATION
                ? FRAME_TYPE_CONFIG_MAP.FRAME_LAST
                : FRAME_TYPE_CONFIG_MAP.FRAME_COMPLETE
              : opcodeQuadBit === DATA_TYPE_MAP.OPCODE_CONTINUATION
                ? FRAME_TYPE_CONFIG_MAP.FRAME_MORE
                : FRAME_TYPE_CONFIG_MAP.FRAME_FIRST
            decodedDataType = opcodeQuadBit
            decodedIsMask = ((initialQuadlet & BIT_1000_0000) !== 0)

            if (initialLength === 0) {
              decodedDataBufferLength = 0
              decodeStage = DECODE_STAGE_END_FRAME // complete, a 16bit frame
            } else if (initialLength <= 125) {
              decodedDataBufferLength = initialLength
              decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER
            } else if (initialLength === 126) decodeStage = DECODE_STAGE_EXTEND_DATA_LENGTH_2
            else decodeStage = DECODE_STAGE_EXTEND_DATA_LENGTH_6

            __DEV__ && console.log('[DECODE_STAGE_INITIAL_OCTET]', { FINQuadBit, opcodeQuadBit, initialLength })
            return true
          }
          break
        case DECODE_STAGE_EXTEND_DATA_LENGTH_2:
          if (chunkListBufferLength >= 2) {
            const chunkDataBuffer = getMergedChunkDataBuffer(2)
            decodedDataBufferLength = chunkDataBuffer.readUIntBE(0, 2, !__DEV__)
            decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

            __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_2]', { decodedDataBufferLength })
            return true
          }
          break
        case DECODE_STAGE_EXTEND_DATA_LENGTH_6:
          if (chunkListBufferLength >= 6) {
            const chunkDataBuffer = getMergedChunkDataBuffer(6)
            decodedDataBufferLength = chunkDataBuffer.readUIntBE(0, 6, !__DEV__)
            decodeStage = decodedIsMask ? DECODE_STAGE_MASK_QUADLET : DECODE_STAGE_DATA_BUFFER

            __DEV__ && console.log('[DECODE_STAGE_EXTEND_DATA_LENGTH_6]', { decodedDataBufferLength })
            return true
          }
          break
        case DECODE_STAGE_MASK_QUADLET:
          if (chunkListBufferLength >= 4) {
            const chunkDataBuffer = getMergedChunkDataBuffer(4)
            decodedMaskQuadlet = chunkDataBuffer.readUInt32BE(0, !__DEV__)
            decodeStage = DECODE_STAGE_DATA_BUFFER

            __DEV__ && console.log('[DECODE_STAGE_MASK_QUADLET]', { decodedMaskQuadlet })
            return true
          }
          break
        case DECODE_STAGE_DATA_BUFFER:
          if (chunkListBufferLength >= decodedDataBufferLength) {
            decodedDataBuffer = getMergedChunkDataBuffer(decodedDataBufferLength)
            decodedIsMask && applyBufferMaskQuadlet(decodedDataBuffer, decodedMaskQuadlet)
            decodeStage = DECODE_STAGE_END_FRAME

            __DEV__ && console.log('[DECODE_STAGE_DATA_BUFFER]', { decodedDataBuffer }, decodedDataBuffer.toString())
            return true
          }
          break
      }
      return false // no parse-able buffer
    }

    let receiveResolve = null
    let receiveReject = null
    const resetReceive = () => {
      __DEV__ && console.log('[Frame] resetReceive')
      socket.removeListener('error', receiveReject)
      receiveResolve = null
      receiveReject = null

      decodeStage = DECODE_STAGE_INITIAL_OCTET
      decodedFrameTypeConfig = null
      decodedDataType = null
      decodedIsMask = false
      decodedMaskQuadlet = null
      decodedDataBuffer = null
      decodedDataBufferLength = 0
    }

    const checkReceive = (chunk) => {
      __DEV__ && console.log('[Frame] checkReceive', chunk.length, { chunk })
      pushChunkDataBuffer(chunk)

      __DEV__ && console.log('[Frame] checkReceive')
      while (decode()) {
        if (decodeStage === DECODE_STAGE_END_FRAME) {
          __DEV__ && console.log('[Frame] checkReceive got one frame', { decodedDataBuffer })
          receiveResolve({
            isFIN: decodedFrameTypeConfig.FINQuadBit === BIT_1000,
            dataType: decodedDataType,
            dataBuffer: decodedDataBuffer,
            dataBufferLength: decodedDataBufferLength
          })
          resetReceive()
        }
      }
    }

    const onSocketData = (chunk) => {
      if (!receiveResolve || !receiveReject) {
        __DEV__ && console.log('[Frame] onSocketData first chunk')
        // HACK: first pick out resolve to delay Promise resolve
        const receivePromise = new Promise((resolve, reject) => {
          socket.on('error', reject)
          receiveResolve = resolve
          receiveReject = reject
        })
        this.queuePromise(() => receivePromise.then(onFrame), (error) => {
          resetReceive()
          onError(error)
        })
      }

      checkReceive(chunk)
    }

    this.clear()
    socket.on('data', onSocketData)
    this.doClearSocketListener = () => socket.removeListener('data', onSocketData)
  }
}

// will change buffer
const applyBufferMaskQuadlet = (buffer, maskQuadlet) => {
  const { length } = buffer
  const extraBitCount = length & 0x3
  const indexMax = length - extraBitCount

  __DEV__ && console.log('applyBufferMaskQuadlet', { length, extraBitCount, indexMax })

  for (let index = 0; index < indexMax; index += 4) buffer.writeUInt32BE(buffer.readUInt32BE(index, !__DEV__) ^ maskQuadlet, index, !__DEV__)

  extraBitCount !== 0 && buffer.writeUIntBE(
    buffer.readUIntBE(indexMax, extraBitCount, !__DEV__) ^ (maskQuadlet >>> ((4 - extraBitCount) << 3)),
    indexMax,
    extraBitCount,
    !__DEV__
  )
}

export {
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  DO_MASK_DATA,
  DO_NOT_MASK_DATA,
  FrameSender,
  FrameReceiver
}
