import { constants } from 'crypto'
import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'

import { clock } from 'source/common/time'
import { createCacheMap } from 'source/common/data/CacheMap'
import { createStateStoreLite } from 'source/common/immutable/StateStore'
import { responderEnd } from './Responder/Common'

const DEFAULT_HTTPS_OPTION = {
  protocol: 'https:',
  hostname: 'localhost',
  port: 443,
  isSecure: true,
  // key: 'BUFFER: KEY.pem', // [optional]
  // cert: 'BUFFER: CERT.pem', // [optional]
  // ca: 'BUFFER: CA.pem', // [optional]
  // dhparam: 'BUFFER: DHPARAM.pem',  // [optional] Diffie-Hellman Key Exchange, generate with `openssl dhparam -out path/dh2048.pem 2048`
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2 // https://taylorpetrick.com/blog/post/https-nodejs-letsencrypt
}
const DEFAULT_HTTP_OPTION = {
  protocol: 'http:',
  hostname: 'localhost',
  port: 80,
  isSecure: false
}
const VALID_SERVER_PROTOCOL_SET = new Set([
  DEFAULT_HTTPS_OPTION.protocol,
  DEFAULT_HTTP_OPTION.protocol
])

const SSL_SESSION_CACHE_MAX = 4 * 1024
const SSL_SESSION_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min
const applyServerSessionCache = (server) => {
  const sslSessionCacheMap = createCacheMap({ valueSizeSumMax: SSL_SESSION_CACHE_MAX })
  server.on('newSession', (sessionId, sessionData, next) => {
    __DEV__ && console.log('newSession', sessionId.toString('hex'))
    sslSessionCacheMap.set(sessionId.toString('hex'), sessionData, 1, Date.now() + SSL_SESSION_EXPIRE_TIME)
    next()
  })
  server.on('resumeSession', (sessionId, next) => {
    __DEV__ && console.log('resumeSession', sessionId.toString('hex'))
    next(null, sslSessionCacheMap.get(sessionId.toString('hex')) || null)
  })
}

const createServer = ({ protocol, ...option }) => {
  if (!VALID_SERVER_PROTOCOL_SET.has(protocol)) throw new Error(`[createServer] invalid protocol: ${protocol}`)
  option = { ...(protocol === 'https:' ? DEFAULT_HTTPS_OPTION : DEFAULT_HTTP_OPTION), ...option }
  option.baseUrl = `${protocol}//${option.hostname}:${option.port}`

  const server = option.isSecure ? createHttpsServer(option) : createHttpServer() // NOTE: the argument is different for https/http.createServer
  option.isSecure && applyServerSessionCache(server)
  return {
    server,
    option,
    start: () => { !server.listening && server.listen(option.port, option.hostname) },
    stop: () => { server.listening && server.close() }
  }
}

const DEFAULT_RESPONDER_END = responderEnd
const DEFAULT_RESPONDER_ERROR = (store, error) => store.setState({ error })

const createRequestListener = ({
  responderList = [],
  responderEnd = DEFAULT_RESPONDER_END,
  responderError = DEFAULT_RESPONDER_ERROR
}) => async (request, response) => {
  __DEV__ && console.log(`[request] ${request.method}: ${request.url}`)
  const stateStore = createStateStoreLite({
    time: clock(), // in msec, relative
    error: null // from failed responder
  })
  stateStore.request = request
  stateStore.response = response
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { await responderError(stateStore, error) }
  await responderEnd(stateStore)
}

export {
  createServer,
  createRequestListener
}
