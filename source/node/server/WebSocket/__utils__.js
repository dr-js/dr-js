import { createHash, randomBytes } from 'crypto'

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
  DEFAULT_FRAME_LENGTH_LIMIT,
  WEB_SOCKET_VERSION,
  WEB_SOCKET_EVENT_MAP,
  getRequestKey,
  getRespondKey
}
