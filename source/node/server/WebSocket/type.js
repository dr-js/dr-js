import { createHash, randomBytes } from 'crypto'

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
//     |     if payload len == 127     |Masking-key, if MASK set to 1  |
//     +-------------------------------+-------------------------------+
//     | Masking-key (continued)       |          Payload Data         |
//     +-------------------------------- - - - - - - - - - - - - - - - +
//     :                     Payload Data continued ...                :
//     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
//     |                     Payload Data continued ...                |
//     +---------------------------------------------------------------+

// NOTE: these quadbit will also set RSV123 to 0, thus will ignore extension bits RSV1-3
const FRAME_TYPE_CONFIG_MAP = {
  FRAME_COMPLETE: { FINQuadBit: 0b1000, opcodeQuadBitMask: 0b1111 },
  FRAME_FIRST: { FINQuadBit: 0b0000, opcodeQuadBitMask: 0b1111 },
  FRAME_MORE: { FINQuadBit: 0b0000, opcodeQuadBitMask: 0b0000 },
  FRAME_LAST: { FINQuadBit: 0b1000, opcodeQuadBitMask: 0b0000 }
}
const DATA_TYPE_MAP = {
  OPCODE_CONTINUATION: 0b0000,
  OPCODE_TEXT: 0b0001,
  OPCODE_BINARY: 0b0010,
  OPCODE_CLOSE: 0b1000,
  OPCODE_PING: 0b1001,
  OPCODE_PONG: 0b1010
}
const DO_MASK_DATA = true
const DO_NOT_MASK_DATA = false
const DEFAULT_FRAME_LENGTH_LIMIT = 8 * 1024 * 1024 // 8 MiB

const WEB_SOCKET_VERSION = 13
const WEB_SOCKET_EVENT_MAP = {
  OPEN: 'web-socket:open',
  FRAME: 'web-socket:frame',
  CLOSE: 'web-socket:close'
}
const WEB_SOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const getRequestKey = () => randomBytes(16).toString('base64')
const getRespondKey = (requestKey) => createHash('sha1').update(`${requestKey}${WEB_SOCKET_MAGIC_STRING}`).digest('base64')

export {
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  DO_MASK_DATA,
  DO_NOT_MASK_DATA,
  DEFAULT_FRAME_LENGTH_LIMIT,

  WEB_SOCKET_VERSION,
  WEB_SOCKET_EVENT_MAP,
  getRequestKey,
  getRespondKey
}
