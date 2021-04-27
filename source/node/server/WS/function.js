import { randomBytes } from 'crypto'
import { constants as bufferConstants } from 'buffer'
import { calcHash } from 'source/node/data/Buffer.js'

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
const FRAME_CONFIG = {
  // [ quadbitFIN, quadbitOpcodeMask ]
  COMPLETE: [ 0b1000, 0b1111 ],
  FIRST: [ 0b0000, 0b1111 ],
  MORE: [ 0b0000, 0b0000 ],
  LAST: [ 0b1000, 0b0000 ]
}

const OPCODE_TYPE = {
  CONTINUATION: 0b0000,
  TEXT: 0b0001,
  BINARY: 0b0010,
  CLOSE: 0b1000,
  PING: 0b1001,
  PONG: 0b1010
}

const WEBSOCKET_VERSION = 13
const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const getRequestKey = () => randomBytes(16).toString('base64')
const getRespondKey = (requestKey) => calcHash(`${requestKey}${WEBSOCKET_MAGIC_STRING}`)

const BUFFER_MAX_LENGTH = bufferConstants.MAX_LENGTH // max at (2^31) - 1, less than Number.MAX_SAFE_INTEGER at (2^53) - 1

// NOTE: will overwrite buffer // TODO: consider further optimize speed?
const applyMaskQuadletBufferInPlace = (buffer, maskQuadletBuffer, indexOffset = 0) => {
  for (let index = 0, indexMax = buffer.length - indexOffset; index < indexMax; index++) {
    buffer[ index + indexOffset ] ^= maskQuadletBuffer[ index & 3 ]
  }
}

// `sec-websocket-protocol` string is comma separated string like: `a,b,c-d-e`
const packProtocolList = (array) => array.join(',')
const parseProtocolString = (string) => (string || '').split(/, */)

export {
  FRAME_CONFIG,
  OPCODE_TYPE,

  WEBSOCKET_VERSION, getRequestKey, getRespondKey,

  BUFFER_MAX_LENGTH, applyMaskQuadletBufferInPlace,

  packProtocolList, parseProtocolString
}
