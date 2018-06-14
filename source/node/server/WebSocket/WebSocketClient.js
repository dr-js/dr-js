import { URL } from 'url'
import { get as httpGet } from 'http'
import { get as httpsGet } from 'https'
import { urlToOption } from 'source/node/net'
import { DO_MASK_DATA, DEFAULT_FRAME_LENGTH_LIMIT, WEB_SOCKET_VERSION, WEB_SOCKET_EVENT_MAP, getRequestKey, getRespondKey } from './type'
import { createWebSocket } from './WebSocket'

const VALID_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
const SECURE_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])
const DEFAULT_ON_UPGRADE_RESPONSE = (webSocket, response, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

const buildUpgradeRequest = (url, { key, isSecure, headers, origin = '', requestProtocolString = '' }) => {
  const requestKey = key || getRequestKey()
  const responseKey = getRespondKey(requestKey)
  const requestOption = {
    ...urlToOption(url),
    protocol: undefined, // node do not use 'ws/wss', will use auto set 'http/https' instead
    port: url.port !== '' ? url.port : (isSecure ? 443 : 80),
    headers: {
      ...headers,
      origin,
      'upgrade': 'websocket',
      'connection': 'upgrade',
      'sec-websocket-version': WEB_SOCKET_VERSION,
      'sec-websocket-key': requestKey,
      'sec-websocket-protocol': requestProtocolString
    }
  }
  return { requestOption, requestProtocolString, responseKey }
}

const doUpgradeSocket = (webSocket, response, responseKey, requestProtocolString) => {
  if (webSocket.getReadyState() !== webSocket.CONNECTING) throw new Error(`[WebSocketClient][doUpgradeSocket] error readyState ${webSocket.getReadyState()}`)
  if (responseKey !== response.headers[ 'sec-websocket-accept' ]) throw new Error('[WebSocketClient][doUpgradeSocket] wrong sec-websocket-accept')
  const protocol = response.headers[ 'sec-websocket-protocol' ]
  if (!requestProtocolString.split(/, */).includes(protocol)) throw new Error(`[WebSocketClient][doUpgradeSocket] unexpected protocol ${protocol}`)
  webSocket.socket.on('error', webSocket.close)
  webSocket.socket.on('end', webSocket.close)
  __DEV__ && console.log('[WebSocketClient][doUpgradeSocket]', responseKey)
  webSocket.listenAndReceiveFrame()
  webSocket.protocol = protocol // the accepted protocol
  webSocket.setReadyState(webSocket.OPEN)
  webSocket.emit(WEB_SOCKET_EVENT_MAP.OPEN)
}

const createWebSocketClient = ({
  urlString,
  option = {},
  onError,
  onUpgradeResponse = DEFAULT_ON_UPGRADE_RESPONSE,
  frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT
}) => {
  const url = new URL(urlString)
  if (!VALID_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)) throw new Error(`[WebSocketClient] invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`[WebSocketClient] invalid url host: ${url.host}`)
  option.isSecure = SECURE_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)

  const { requestOption, requestProtocolString, responseKey } = buildUpgradeRequest(url, option)
  const request = (option.isSecure ? httpsGet : httpGet)(requestOption)

  request.on('error', (error) => {
    if (request.aborted) return
    request.abort()
    onError(error)
  })
  request.on('response', (response) => {
    __DEV__ && console.log('[WebSocketClient] unexpected response', response)
    request.abort()
    onError(new Error('[WebSocketClient] unexpected response'))
  })
  request.on('upgrade', async (response, socket, bodyHeadBuffer) => {
    const webSocket = createWebSocket({ socket, frameLengthLimit, sendFrameMaskType: DO_MASK_DATA })

    webSocket.origin = option.origin
    webSocket.isSecure = option.isSecure

    await onUpgradeResponse(webSocket, response, bodyHeadBuffer)
    __DEV__ && webSocket.isClosed() && console.log('[WebSocketClient] UpgradeResponse closed webSocket')
    if (webSocket.isClosed()) return

    doUpgradeSocket(webSocket, response, responseKey, requestProtocolString)
  })
}

export { createWebSocketClient }
