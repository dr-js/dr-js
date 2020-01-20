import { get as httpGet } from 'http'
import { get as httpsGet } from 'https'
import { WEBSOCKET_VERSION, getRequestKey, getRespondKey } from './function'
import { createWebSocket } from './WebSocket'

const VALID_WEBSOCKET_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
const SECURE_WEBSOCKET_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])
const DEFAULT_ON_UPGRADE_RESPONSE = (webSocket, response, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket

const doUpgradeSocket = (webSocket, response, responseKey, requestProtocolString) => {
  if (webSocket.getReadyState() !== webSocket.CONNECTING) throw new Error(`error readyState ${webSocket.getReadyState()}`)
  if (responseKey !== response.headers[ 'sec-websocket-accept' ]) throw new Error('wrong sec-websocket-accept')
  const protocol = response.headers[ 'sec-websocket-protocol' ]
  if (!requestProtocolString.split(/, */).includes(protocol)) throw new Error(`unexpected protocol ${protocol}`)
  __DEV__ && console.log('[WebSocketClient][doUpgradeSocket]', responseKey)
  webSocket.protocol = protocol // the accepted protocol
  webSocket.open()
}

const createWebSocketClient = ({
  url, // URL/String
  option: {
    key,
    headers,
    origin = '',
    requestProtocolString = '' // comma separated string like: `a,b,c-d-e`
  } = {},
  onError,
  onUpgradeResponse = DEFAULT_ON_UPGRADE_RESPONSE,
  frameLengthLimit
}) => {
  url = url instanceof URL ? url : new URL(url)
  if (!VALID_WEBSOCKET_PROTOCOL_SET.has(url.protocol)) throw new Error(`invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`invalid url host: ${url.host}`)

  const isSecure = SECURE_WEBSOCKET_PROTOCOL_SET.has(url.protocol)
  const requestKey = key || getRequestKey()
  const responseKey = getRespondKey(requestKey)

  url.protocol = isSecure ? 'https:' : 'http:' // TODO: PATCH: node require `protocol` to match `agent.protocol`, so use 'http:/https:' for 'ws:/wss:' instead

  const request = (isSecure ? httpsGet : httpGet)(url, {
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
    onError(new Error('unexpected response'))
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
