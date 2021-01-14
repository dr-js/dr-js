import { createInsideOutPromise } from 'source/common/function'
import { requestHttp } from 'source/node/net'
import { createWSBase } from './Base'
import { WEBSOCKET_VERSION, getRequestKey, getRespondKey, packProtocolList } from './function'

const VALID_PROTOCOL_SET = new Set([ 'wss:', 'ws:', 'https:', 'http:' ])
const SECURE_PROTOCOL_SET = new Set([ 'wss:', 'https:' ])

const createWSClient = (url, {
  protocolList, // [ 'some-protocol', 'another' ] // required
  requestKey = getRequestKey(),
  onUpgradeResponse = (response, socket, headBuffer, info) => {}, // accept by default, throw error to deny, allow extend info
  dataLengthLimit, isMask = true, shouldPing = false, // by default, client do mask and do not ping
  ...option // other HTTP request options
}) => {
  url = url instanceof URL ? url : new URL(url)
  if (!VALID_PROTOCOL_SET.has(url.protocol)) throw new Error(`invalid url protocol: ${url.protocol}`)
  if (!url.host) throw new Error(`invalid url host: ${url.host}`)
  const isSecure = SECURE_PROTOCOL_SET.has(url.protocol)
  url.protocol = isSecure ? 'https:' : 'http:' // NOTE: node require `protocol` to match `agent.protocol`, so use 'http:/https:' to replace 'ws:/wss:'
  option.headers = {
    ...option.headers,
    'upgrade': 'websocket',
    'connection': 'upgrade',
    'sec-websocket-version': WEBSOCKET_VERSION,
    'sec-websocket-key': requestKey,
    'sec-websocket-protocol': packProtocolList(protocolList)
  }

  const IOP = createInsideOutPromise()
  const onError = (error) => {
    __DEV__ && console.log('[WSClient|onError]', error)
    request.destroy()
    IOP.reject(error)
  }

  const { request, promise } = requestHttp(url, option)
  promise.then((response) => { // "upgrade" event is processed, should not have "response" event
    __DEV__ && console.log('[WSClient|response] unexpected', response)
    onError(new Error('unexpected response'))
  }, onError)

  // request.on('error', onError) // NOTE: already listened in requestHttp
  request.once('upgrade', async (response, socket, headBuffer) => {
    __DEV__ && console.log('[WSClient|upgrade]')
    try {
      const protocol = response.headers[ 'sec-websocket-protocol' ]
      if (!protocolList.includes(protocol)) throw new Error(`unexpected protocol ${protocol}`)
      if (getRespondKey(requestKey) !== response.headers[ 'sec-websocket-accept' ]) throw new Error('wrong sec-websocket-accept')

      const info = { isSecure, protocol, protocolList, headers: response.headers, url }
      await onUpgradeResponse(response, socket, headBuffer, info)
      __DEV__ && console.log('[WSClient|upgrade] onUpgradeResponse done')

      IOP.resolve(createWSBase({ socket, info, dataLengthLimit, isMask, shouldPing }))
    } catch (error) { onError(error) }
  })

  return IOP.promise // resolve to WSBase
}

export { createWSClient }
