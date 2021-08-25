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
/** @deprecated */ const FRAME_CONFIG = {
  // [ quadbitFIN, quadbitOpcodeMask ]
  COMPLETE: [ 0b1000, 0b1111 ],
  FIRST: [ 0b0000, 0b1111 ],
  MORE: [ 0b0000, 0b0000 ],
  LAST: [ 0b1000, 0b0000 ]
}

/** @deprecated */ const OPCODE_TYPE = {
  CONTINUATION: 0b0000,
  TEXT: 0b0001,
  BINARY: 0b0010,
  CLOSE: 0b1000,
  PING: 0b1001,
  PONG: 0b1010
}

/** @deprecated */ const WEBSOCKET_VERSION = 13
/** @deprecated */ const WEBSOCKET_EVENT = {
  OPEN: 'ws:open',
  FRAME: 'ws:frame',
  CLOSE: 'ws:close'
}

const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
/** @deprecated */ const getRequestKey = () => randomBytes(16).toString('base64')
/** @deprecated */ const getRespondKey = (requestKey) => calcHash(`${requestKey}${WEBSOCKET_MAGIC_STRING}`)

/** @deprecated */ const BUFFER_MAX_LENGTH = bufferConstants.MAX_LENGTH // max at (2^31) - 1, less than Number.MAX_SAFE_INTEGER at (2^53) - 1

// TODO: will overwrite buffer, consider optimize speed?
/** @deprecated */ const applyMaskQuadletBufferInPlace = (buffer, maskQuadletBuffer) => {
  for (let index = 0, indexMax = buffer.length; index < indexMax; index++) {
    buffer[ index ] ^= maskQuadletBuffer[ index & 3 ]
  }
}

export { // TODO: DEPRECATE: use `node/server/WS`
  FRAME_CONFIG,
  OPCODE_TYPE,

  WEBSOCKET_VERSION,
  WEBSOCKET_EVENT,

  getRequestKey,
  getRespondKey,

  BUFFER_MAX_LENGTH,
  applyMaskQuadletBufferInPlace
}
