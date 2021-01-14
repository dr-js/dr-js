import { clock } from 'source/common/time'
import { createStateStoreLite } from 'source/common/immutable/StateStore'
import { createWSBase } from './Base'
import { WEBSOCKET_VERSION, getRespondKey, parseProtocolString } from './function'

const enableWSServer = (server, {
  onUpgradeRequest = (request, socket, headBuffer, info) => {}, // do nothing by default, will close socket
  onError = (error) => { console.error('[WSServer|onError]', error) }, // should watch for error, default log&mute so server will keep running
  dataLengthLimit, isMask = false, shouldPing = true, // by default, server do not mask and do ping
  wsSet = new Set()
}) => {
  server.on('upgrade', async (request, socket, headBuffer) => {
    try {
      const requestKey = request.headers[ 'sec-websocket-key' ]
      const version = parseInt(request.headers[ 'sec-websocket-version' ])
      const protocolList = parseProtocolString(request.headers[ 'sec-websocket-protocol' ])
      if (
        !requestKey ||
        version !== WEBSOCKET_VERSION ||
        request.method !== 'GET' ||
        request.headers[ 'upgrade' ].toLowerCase() !== 'websocket'
      ) throw new Error('invalid upgrade request')

      const info = {
        isSecure: request.socket.encrypted,
        protocol: undefined, // not decided yet
        protocolList,
        headers: request.headers
      }

      let ws
      info.getWS = (protocol) => {
        if (ws !== undefined) return ws
        if (!protocol || !protocolList.includes(protocol)) throw new Error(`no/wrong selected protocol: "${protocol}"`)

        socket.write(joinHeader(
          'HTTP/1.1 101 Switching Protocols',
          'upgrade: websocket',
          'connection: upgrade',
          `sec-websocket-accept: ${getRespondKey(requestKey)}`,
          `sec-websocket-protocol: ${protocol}`
        ))

        info.protocol = protocol // add protocol
        ws = createWSBase({ socket, info, dataLengthLimit, isMask, shouldPing })
        wsSet.add(ws)
        __DEV__ && console.log(`WS open, current active: ${wsSet.size}`)
        ws.promise.then(() => {
          wsSet.delete(ws)
          __DEV__ && console.log(`WS close, current active: ${wsSet.size}`)
        })
        return ws
      }

      await onUpgradeRequest(request, socket, headBuffer, info) // select protocol from info.protocolList, and use `const ws = info.getWS(protocol)` to get ws
    } catch (error) {
      socket.writableEnded || socket.end(joinHeader( // close HTTP upgrade, no ws yet
        'HTTP/1.1 400 Bad Request',
        'connection: close'
      ))
      onError(error)
    }
  })
  return wsSet
}
const joinHeader = (...args) => [ ...args, '\r\n' ].filter(Boolean).join('\r\n')

const createUpgradeRequestListener = ({
  responderList = [],
  responderError = DEFAULT_RESPONDER_ERROR,
  responderEnd = DEFAULT_RESPONDER_END
}) => async (request, socket, headBuffer, info) => {
  __DEV__ && console.log(`[createUpdateRequestListener] ${request.method}: ${request.url}`)
  const store = createStateStoreLite({
    time: clock(), // in msec
    error: null, // from failed responder, but will not be processed
    socket, headBuffer, info
  })
  store.request = request // http.IncomingMessage: https://nodejs.org/api/http.html#http_class_http_incomingmessage
  store.response = { finished: true, headersSent: true, writableEnded: true, statusCode: 101 } // basic mock response, for responder log
  store.ws = undefined // set with `upgradeWS`
  store.upgradeWS = (protocol) => { store.ws = info.getWS(protocol) }
  try { // early responder should use code like: `store.upgradeWS(store.getState().info[ 0 ])` to fill the `store.ws`
    for (const responder of responderList) await responder(store)
  } catch (error) { await responderError(store, error) }
  await responderEnd(store)
}
const DEFAULT_RESPONDER_ERROR = (store, error) => {
  __DEV__ && console.log('[createUpdateRequestListener|DEFAULT_RESPONDER_ERROR]', error)
  store.setState({ error })
}
const DEFAULT_RESPONDER_END = (store) => store.ws && store.ws.closeClear(store.getState().error)

export {
  enableWSServer,
  createUpgradeRequestListener
}
