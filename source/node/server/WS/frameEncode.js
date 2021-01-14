import { randomBytes } from 'crypto'
import { END } from 'source/common/module/Runlet'

import { FRAME_CONFIG, OPCODE_TYPE, BUFFER_MAX_LENGTH, applyMaskQuadletBufferInPlace } from './function'

const DEFAULT_MASK_QUADLET_BUFFER = Buffer.alloc(4)

const encodeFrameBuffer = (opcode, dataBuffer, isMask) => {
  __DEV__ && console.log('>> encode', { opcode, isMask }, String(dataBuffer).slice(0, 20))
  const dataLength = dataBuffer.length

  const [ quadbitFIN, quadbitOpcodeMask ] = FRAME_CONFIG.COMPLETE // TODO: NOTE: only sending complete frame is supported
  const initialOctet = (quadbitFIN << 4) | (opcode & quadbitOpcodeMask)

  let maskLengthOctet, extendLengthOctetCount
  if (dataLength <= 125) {
    maskLengthOctet = dataLength
    extendLengthOctetCount = 0
  } else if (dataLength <= 65535) {
    maskLengthOctet = 126
    extendLengthOctetCount = 2
  } else if (dataLength <= BUFFER_MAX_LENGTH) { // though max length limit is Math.pow(2, 63) octets
    maskLengthOctet = 127
    extendLengthOctetCount = 8
  } else throw new Error(`dataLength too big: ${dataLength}`)

  const maskOctetCount = isMask ? 4 : 0
  const maskQuadletBuffer = (isMask && dataLength) ? randomBytes(4) : DEFAULT_MASK_QUADLET_BUFFER // 4octets | 32bits
  if (isMask) maskLengthOctet |= 0b10000000

  const headerBuffer = Buffer.allocUnsafe(2 + extendLengthOctetCount + maskOctetCount) // 2-14octets | 16-112bits
  headerBuffer.writeUInt16BE((initialOctet << 8) | maskLengthOctet, 0) // FIN_BIT/RSV/OPCODE/MASK_BIT/LENGTH [2octets]
  extendLengthOctetCount === 2 && headerBuffer.writeUInt16BE(dataLength, 2) // EXTEND LENGTH [2octets]
  extendLengthOctetCount === 8 && headerBuffer.writeUInt32BE(0, 2) // EXTEND LENGTH [4 of 8octets] // NOTE: can't use in node with buffer.constants.MAX_LENGTH
  extendLengthOctetCount === 8 && headerBuffer.writeUInt32BE(dataLength, 6) // EXTEND LENGTH [4 of 8octets]
  isMask && maskQuadletBuffer.copy(headerBuffer, 2 + extendLengthOctetCount) // MASK [4octets]

  const frameBuffer = Buffer.concat([ headerBuffer, dataBuffer ])
  isMask && dataLength && applyMaskQuadletBufferInPlace(frameBuffer, maskQuadletBuffer, headerBuffer.length) // apply mask to copied dataBuffer

  return frameBuffer
}

const createFrameEncodeChip = ({ // encode framePack object to buffer for sending directly to socket
  isMask,
  dataLengthLimit = 16 * 1024 * 1024, // limit to 16MiB
  key = 'chip:frame-encode', ...extra // all the extra Pool/Pend config
}) => ({
  ...extra, key,
  state: {
    isMask, dataLengthLimit
  },
  sync: true, process: (pack, state, error) => {
    if (error) return
    if (pack[ 1 ] === END) return { pack, state }
    const { opcode, buffer } = pack[ 0 ] // framePack
    if (buffer.length > state.dataLengthLimit) throw new Error(`dataLength ${buffer.length} exceeds limit: ${dataLengthLimit}`)
    pack[ 0 ] = encodeFrameBuffer(opcode, buffer, state.isMask)

    return { pack, state }
  }
})

const encodeTextFramePack = (string) => ({ opcode: OPCODE_TYPE.TEXT, buffer: Buffer.from(string) })
const encodeBinaryFramePack = (buffer) => ({ opcode: OPCODE_TYPE.BINARY, buffer })
const createCloseFramePack = (code = 1000, reason = '') => {
  const stringLength = Buffer.byteLength(reason)
  const buffer = Buffer.allocUnsafe(2 + stringLength)
  buffer.writeUInt16BE(code, 0)
  buffer.write(reason, 2, stringLength)
  return { opcode: OPCODE_TYPE.CLOSE, buffer }
}
const encodePingFramePack = (buffer) => ({ opcode: OPCODE_TYPE.PING, buffer })
const encodePongFramePack = (buffer) => ({ opcode: OPCODE_TYPE.PONG, buffer })

export {
  createFrameEncodeChip,

  encodeTextFramePack,
  encodeBinaryFramePack,
  createCloseFramePack,
  encodePingFramePack,
  encodePongFramePack
}
