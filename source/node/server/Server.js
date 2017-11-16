import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { constants } from 'crypto'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'
import { createMinStateStore } from 'source/common/immutable'
import { responderEnd } from './Responder'

const SSL_SESSION_CACHE_MAX = 5000
const SSL_SESSION_EXPIRE_TIME = 5 * 60 * 1000 // in msec, 5min

const DEFAULT_HTTPS_OPTION = {
  protocol: 'https:',
  hostname: 'localhost',
  port: 443,
  isSecure: true,
  // key: 'BUFFER: KEY.pem', // [optional]
  // cert: 'BUFFER: CERT.pem', // [optional]
  // ca: 'BUFFER: CA.pem', // [optional]
  // dhparam: 'BUFFER: DHPARAM.pem',  // [optional] Diffie-Hellman Key Exchange
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2 // https://taylorpetrick.com/blog/post/https-nodejs-letsencrypt
}
const DEFAULT_HTTP_OPTION = {
  protocol: 'http:',
  hostname: 'localhost',
  port: 80,
  isSecure: false
}
const VALID_SERVER_PROTOCOL_SET = new Set([ DEFAULT_HTTPS_OPTION.protocol, DEFAULT_HTTP_OPTION.protocol ])

const getServerOption = (protocol, option) => {
  if (!VALID_SERVER_PROTOCOL_SET.has(protocol)) throw new Error(`[createServer] invalid protocol: ${protocol}`)
  option = { ...(protocol === 'https:' ? DEFAULT_HTTPS_OPTION : DEFAULT_HTTP_OPTION), ...option } // set defaults
  option.baseUrl = `${protocol}//${option.hostname}:${option.port}`
  return option
}
const getServerToggle = (server, { hostname, port, baseUrl }) => ({
  start: () => {
    !server.listening && server.listen(port, hostname)
    __DEV__ && !server.listening && console.log(`Server running at: '${baseUrl}'`)
  },
  stop: () => {
    server.listening && server.close()
    __DEV__ && server.listening && console.log('Server stopped')
  }
})
const applyServerSessionCache = (server) => {
  const sslSessionCacheMap = new CacheMap({ valueSizeSumMax: SSL_SESSION_CACHE_MAX })
  server.on('newSession', (sessionId, sessionData, next) => {
    __DEV__ && console.log('newSession', sessionId.toString('hex'))
    sslSessionCacheMap.set(sessionId.toString('hex'), sessionData, 1, clock() + SSL_SESSION_EXPIRE_TIME)
    next()
  })
  server.on('resumeSession', (sessionId, next) => {
    __DEV__ && console.log('resumeSession', sessionId.toString('hex'))
    next(null, sslSessionCacheMap.get(sessionId.toString('hex')) || null)
  })
}
const createServer = ({ protocol, ...option }) => {
  option = getServerOption(protocol, option)
  const server = option.isSecure ? nodeModuleHttps.createServer(option) : nodeModuleHttp.createServer() // TODO: NOTE: the argument is different for https/http.createServer
  const { start, stop } = getServerToggle(server, option)
  option.isSecure && applyServerSessionCache(server)
  return { server, start, stop, option }
}

const DEFAULT_RESPONSE_REDUCER_LIST = __DEV__ ? [ (store) => console.log(store.getState()) ] : []
const DEFAULT_RESPONSE_REDUCER_ERROR = (store, error) => store.setState({ error })
const DEFAULT_RESPONSE_REDUCER_END = responderEnd
const GET_INITIAL_STORE_STATE = () => ({
  error: null, // from failed responder
  time: clock(), // in msec
  url: null, // from createResponderParseURL
  method: null // from createResponderParseURL
})

const createRequestListener = ({
  responderList = DEFAULT_RESPONSE_REDUCER_LIST,
  responderError = DEFAULT_RESPONSE_REDUCER_ERROR,
  responderEnd = DEFAULT_RESPONSE_REDUCER_END
}) => async (request, response) => {
  __DEV__ && console.log(`[request] ${request.method}: ${request.url}`)
  const stateStore = createMinStateStore(GET_INITIAL_STORE_STATE())
  stateStore.request = request
  stateStore.response = response
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { await responderError(stateStore, error) }
  await responderEnd(stateStore)
}

export { createServer, createRequestListener }
