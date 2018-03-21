import { URL } from 'url'
import { get as httpGet } from 'http'
import { get as httpsGet } from 'https'
import { urlToOption } from 'source/node/net'
import { DO_MASK_DATA, DEFAULT_FRAME_LENGTH_LIMIT, WEB_SOCKET_VERSION, WEB_SOCKET_EVENT_MAP, getRequestKey, getRespondKey } from './type'
import { WebSocketBase } from './WebSocketBase'

class WebSocketClient extends WebSocketBase {
  static VALID_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
  static SECURE_WEB_SOCKET_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])
  static DEFAULT_ON_UPGRADE_RESPONSE = (webSocket, response, bodyHeadBuffer) => webSocket.doCloseSocket() // DEFAULT will close socket
  static buildUpgradeRequest (url, { key, isSecure, headers, origin = '', requestProtocolString = '' }) {
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

  constructor (socket, frameLengthLimit) {
    super(socket, frameLengthLimit)

    this.sendFrameMaskType = DO_MASK_DATA
  }

  doUpgradeSocket (response, requestProtocolString, responseKey) {
    if (this.readyState !== WebSocketBase.CONNECTING) throw new Error(`[WebSocketClient][doUpgradeSocket] error readyState ${this.readyState}`)
    if (responseKey !== response.headers[ 'sec-websocket-accept' ]) throw new Error('[WebSocketClient][doUpgradeSocket] wrong sec-websocket-accept')
    const protocol = response.headers[ 'sec-websocket-protocol' ]
    if (!requestProtocolString.split(/, */).includes(protocol)) throw new Error(`[WebSocketClient][doUpgradeSocket] unexpected protocol ${protocol}`)
    this.socket.on('error', this.close)
    this.socket.on('end', this.close)
    __DEV__ && console.log('[WebSocketClient][doUpgradeSocket]', responseKey)
    this.frameReceiver.listenAndReceiveFrame(
      this.socket,
      this.onReceiveFrame,
      (error) => this.close(1006, __DEV__ ? `Frame Error: ${error.message}` : 'Frame Error')
    )
    this.protocol = protocol
    this.readyState = WebSocketBase.OPEN
    this.emit(WEB_SOCKET_EVENT_MAP.OPEN, this)
  }
}

const createWebSocketClient = ({ urlString, option = {}, onError, onUpgradeResponse = WebSocketClient.DEFAULT_ON_UPGRADE_RESPONSE, frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT }) => {
  const url = new URL(urlString)
  if (!WebSocketClient.VALID_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)) throw new Error(`[createWebSocketClient] invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`[createWebSocketClient] invalid url host: ${url.host}`)
  option.isSecure = WebSocketClient.SECURE_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)

  const { requestOption, requestProtocolString, responseKey } = WebSocketClient.buildUpgradeRequest(url, option)
  const request = (option.isSecure ? httpsGet : httpGet)(requestOption)

  request.on('error', (error) => {
    if (request.aborted) return
    request.abort()
    onError(error)
  })

  request.on('response', (response) => {
    request.abort()
    onError(new Error('[createWebSocketClient] unexpected response'))
  })

  request.on('upgrade', async (response, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocketClient(socket, frameLengthLimit)

    await onUpgradeResponse(webSocket, response, bodyHeadBuffer)
    __DEV__ && WebSocketClient.isWebSocketClosed(webSocket) && console.log('[onUpgradeResponse] closed webSocket')
    if (WebSocketClient.isWebSocketClosed(webSocket)) return

    webSocket.doUpgradeSocket(response, requestProtocolString, responseKey)
  })
}

export { WebSocketClient, createWebSocketClient }
