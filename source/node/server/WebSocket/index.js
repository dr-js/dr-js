import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { URL } from 'url'
import { clock } from 'source/common/time'
import { createStateStoreLite } from 'source/common/immutable'
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
    if (WebSocketServer.isWebSocketClosed(webSocket)) return
    if (!protocol) return webSocket.doCloseSocket(new Error('no selected protocol'))

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
  const url = new URL(urlString)
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
const DEFAULT_RESPONSE_REDUCER_ERROR = (store, error) => {
  store.webSocket.doCloseSocket(error)
  store.setState({ error })
}
const GET_INITIAL_STORE_STATE = () => ({
  error: null, // from failed responder, but will not be processed
  time: clock(), // in msec
  url: null, // from createResponderParseURL
  method: null, // from createResponderParseURL
  protocol: ''
})

const createUpdateRequestListener = ({
  responderList = DEFAULT_RESPONSE_REDUCER_LIST,
  responderError = DEFAULT_RESPONSE_REDUCER_ERROR
}) => async (webSocket, request, bodyHeadBuffer) => {
  __DEV__ && console.log(`[createUpdateRequestListener] ${request.method}: ${request.url}`)
  const stateStore = createStateStoreLite(GET_INITIAL_STORE_STATE())
  stateStore.request = request
  stateStore.response = NULL_RESPONSE
  stateStore.webSocket = webSocket
  stateStore.bodyHeadBuffer = bodyHeadBuffer
  try { for (const responder of responderList) await responder(stateStore) } catch (error) { responderError(stateStore, error) }
  return stateStore.getState().protocol
}

export {
  WEB_SOCKET_EVENT_MAP,
  FRAME_TYPE_CONFIG_MAP,
  DATA_TYPE_MAP,
  enableWebSocketServer,
  createWebSocketClient,
  createUpdateRequestListener
}
