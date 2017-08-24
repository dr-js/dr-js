import nodeModuleUrl from 'url'
import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { clock } from 'source/common/time'
import {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  WebSocketServer,
  WebSocketClient
} from './WebSocket'

const DEFAULT_FRAME_LENGTH_LIMIT = 8 * 1024 * 1024 // 8 MiB

const enableWebSocketServer = ({ server, onUpgradeRequest = WebSocketServer.DEFAULT_ON_UPGRADE_REQUEST, frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT }) => {
  const webSocketSet = new Set()
  server.on('upgrade', async (request, socket, bodyHeadBuffer) => {
    const webSocket = new WebSocketServer(socket, frameLengthLimit)
    const { responseKey } = webSocket.parseUpgradeRequest(request)
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    // select and return protocol from protocolList and optionally save the socket, or call doCloseSocket and reject the socket
    const protocol = await onUpgradeRequest(webSocket, request, bodyHeadBuffer)
    if (!protocol && !WebSocketServer.isWebSocketClosed(webSocket)) return webSocket.doCloseSocket()
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    webSocket.doUpgradeSocket(protocol, responseKey)
    __DEV__ && WebSocketClient.isWebSocketClosed(webSocket) && console.log('[onUpgradeResponse] closed webSocket')
    if (WebSocketServer.isWebSocketClosed(webSocket)) return

    webSocketSet.add(webSocket)
    webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
      webSocketSet.delete(webSocket)
      __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.CLOSE, current active: ${webSocketSet.size}`)
    })
    __DEV__ && console.log(`WEB_SOCKET_EVENT_MAP.OPEN, current active: ${webSocketSet.size}`)
  })
  return webSocketSet
}

const createWebSocketClient = ({ urlString, option = {}, onError, onUpgradeResponse = WebSocketClient.DEFAULT_ON_UPGRADE_RESPONSE, frameLengthLimit = DEFAULT_FRAME_LENGTH_LIMIT }) => {
  const url = nodeModuleUrl.parse(urlString)
  if (!WebSocketClient.VALID_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)) throw new Error(`[createWebSocketClient] invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`[createWebSocketClient] invalid url host: ${url.host}`)
  option.isSecure = WebSocketClient.SECURE_WEB_SOCKET_PROTOCOL_SET.has(url.protocol)

  const { requestOption, requestProtocolString, responseKey } = WebSocketClient.buildUpgradeRequest(url, option)
  const request = (option.isSecure ? nodeModuleHttps : nodeModuleHttp).get(requestOption)

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

const NULL_RESPONSE = { finished: true }
const DEFAULT_RESPONSE_REDUCER_LIST = []
const INITIAL_STORE_STATE = {
  protocol: '',
  time: 0, // set by clock(), in msec
  url: null, // from createResponderParseURL
  error: null // from failed responder
}
const createStateStore = (state = INITIAL_STORE_STATE) => ({ getState: () => state, setState: (nextState) => (state = { ...state, ...nextState }) })
const createUpdateRequestListenerFromResponderList = (responderList = DEFAULT_RESPONSE_REDUCER_LIST) => async (webSocket, request, bodyHeadBuffer) => {
  __DEV__ && console.log(`[createUpdateRequestListenerFromResponderList] ${request.method}: ${request.url}`)
  const stateStore = createStateStore({ protocol: '', time: clock(), url: null, error: null })
  stateStore.webSocket = webSocket
  stateStore.request = request
  stateStore.bodyHeadBuffer = bodyHeadBuffer
  stateStore.response = NULL_RESPONSE
  for (const responder of responderList) await responder(stateStore)
  return stateStore.getState().protocol
}

export {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  enableWebSocketServer,
  createWebSocketClient,
  createUpdateRequestListenerFromResponderList
}
