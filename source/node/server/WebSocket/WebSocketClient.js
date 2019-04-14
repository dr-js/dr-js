import { get as httpGet } from 'http'
import { get as httpsGet } from 'https'
import { WEBSOCKET_VERSION, getRequestKey, getRespondKey } from './function'
import { createWebSocket } from './WebSocket'

const VALID_WEBSOCKET_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
const SECURE_WEBSOCKET_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])
const DEFAULT_ON_UPGRADE_RESPONSE = (webSocket, response, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

const doUpgradeSocket = (webSocket, response, responseKey, requestProtocolString) => {
  if (webSocket.getReadyState() !== webSocket.CONNECTING) throw new Error(`[WebSocketClient][doUpgradeSocket] error readyState ${webSocket.getReadyState()}`)
  if (responseKey !== response.headers[ 'sec-websocket-accept' ]) throw new Error('[WebSocketClient][doUpgradeSocket] wrong sec-websocket-accept')
  const protocol = response.headers[ 'sec-websocket-protocol' ]
  if (!requestProtocolString.split(/, */).includes(protocol)) throw new Error(`[WebSocketClient][doUpgradeSocket] unexpected protocol ${protocol}`)
  __DEV__ && console.log('[WebSocketClient][doUpgradeSocket]', responseKey)
  webSocket.protocol = protocol // the accepted protocol
  webSocket.open()
}

const createWebSocketClient = ({
  urlString,
  option: {
    key,
    headers,
    origin = '',
    requestProtocolString = ''
  } = {},
  onError,
  onUpgradeResponse = DEFAULT_ON_UPGRADE_RESPONSE,
  frameLengthLimit
}) => {
  const urlObject = new URL(urlString)
  if (!VALID_WEBSOCKET_PROTOCOL_SET.has(urlObject.protocol)) throw new Error(`[WebSocketClient] invalid url protocol: ${urlObject.protocol}`)
  if (!urlObject.host) throw new Error(`[WebSocketClient] invalid url host: ${urlObject.host}`)

  const isSecure = SECURE_WEBSOCKET_PROTOCOL_SET.has(urlObject.protocol)
  const requestKey = key || getRequestKey()
  const responseKey = getRespondKey(requestKey)

  urlObject.protocol = isSecure ? 'https:' : 'http:' // TODO: PATCH: node require `protocol` to match `agent.protocol`, so use 'http:/https:' for 'ws:/wss:' instead

  const request = (isSecure ? httpsGet : httpGet)(urlObject, {
    headers: {
      origin,
      'upgrade': 'websocket',
      'connection': 'upgrade',
      'sec-websocket-version': WEBSOCKET_VERSION,
      'sec-websocket-key': requestKey,
      'sec-websocket-protocol': requestProtocolString,
      ...headers
    }
  })

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
    const webSocket = createWebSocket({ socket, frameLengthLimit, isMask: true })

    webSocket.origin = origin
    webSocket.isSecure = isSecure

    await onUpgradeResponse(webSocket, response, bodyHeadBuffer)
    __DEV__ && webSocket.isClosed() && console.log('[WebSocketClient] UpgradeResponse closed webSocket')
    if (webSocket.isClosed()) return

    doUpgradeSocket(webSocket, response, responseKey, requestProtocolString)
  })
}

export { createWebSocketClient }
