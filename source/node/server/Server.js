import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { constants } from 'crypto'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'
import { createMinStateStore } from 'source/common/immutable'
import { responderLogState, responderEnd } from './Responder'

const SSL_SESSION_CACHE_MAX = 5000
const SSL_SESSION_EXPIRE_TIME = 5 * 60 * 1000 // in msec, 5min

const VALID_SERVER_PROTOCOL_SET = new Set([ 'https:', 'http:' ])

const DEFAULT_HTTPS_OPTION = {
  protocol: 'https:',
  hostname: 'localhost',
  port: 443,
  key: 'BUFFER: KEY.pem',
  cert: 'BUFFER: CERT.pem',
  ca: 'BUFFER: CA.pem',
  dhparam: 'BUFFER: DHPARAM.pem', // Diffie-Hellman Key Exchange
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2 // https://taylorpetrick.com/blog/post/https-nodejs-letsencrypt
}

const DEFAULT_HTTP_OPTION = {
  protocol: 'http:',
  hostname: 'localhost',
  port: 80
}

const getServerToggle = ({ port, hostname }, server) => ({
  start: () => {
    __DEV__ && !server.listening && console.log('Server running at port', port, 'hostname', hostname)
    !server.listening && server.listen(port, hostname)
  },
  stop: () => {
    __DEV__ && server.listening && console.log('Server stopped')
    server.listening && server.close()
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
const createServer = (option) => {
  if (!VALID_SERVER_PROTOCOL_SET.has(option.protocol)) throw new Error(`[createServer] invalid protocol: ${option.protocol}`)
  const isSecure = option.protocol === 'https:'
  option = { ...(isSecure ? DEFAULT_HTTPS_OPTION : DEFAULT_HTTP_OPTION), ...option } // set defaults
  const server = isSecure ? nodeModuleHttps.createServer(option) : nodeModuleHttp.createServer()
  isSecure && applyServerSessionCache(server)
  const { start, stop } = getServerToggle(option, server)
  return { server, start, stop, baseUrl: `${option.protocol}//${option.hostname}:${option.port}` }
}

const DEFAULT_RESPONSE_REDUCER_LIST = __DEV__ ? [ responderLogState ] : []
const DEFAULT_RESPONSE_REDUCER_ERROR = (store, error) => store.setState({ error })
const DEFAULT_RESPONSE_REDUCER_END = responderEnd
const GET_INITIAL_STORE_STATE = () => ({
  error: null, // from failed responder,
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
  try { for (const responder of responderList) await responder(stateStore) } catch (error) { await responderError(stateStore, error) }
  await responderEnd(stateStore)
}

export {
  createServer,
  createRequestListener
}
