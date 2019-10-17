import { networkInterfaces } from 'os'
import { createServer as createTCPServer } from 'net'
import { createServer as createTLSServer } from 'tls'
import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'

// TODO: add http2?

import { clock } from 'source/common/time'
import { indentList } from 'source/common/string'
import { createCacheMap } from 'source/common/data/CacheMap'
import { createStateStoreLite } from 'source/common/immutable/StateStore'
import { responderEnd } from './Responder/Common'

const SESSION_CACHE_MAX = 4 * 1024
const SESSION_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min
const applyServerSessionCache = (server) => { // TODO: consider move to `ticketKeys`: https://nodejs.org/dist/latest-v12.x/docs/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
  const sessionCacheMap = createCacheMap({ valueSizeSumMax: SESSION_CACHE_MAX, eventHub: null })
  server.on('newSession', (sessionId, sessionData, next) => {
    __DEV__ && console.log('newSession', sessionId.toString('hex'))
    sessionCacheMap.set(sessionId.toString('hex'), sessionData, 1, Date.now() + SESSION_EXPIRE_TIME)
    next()
  })
  server.on('resumeSession', (sessionId, next) => {
    __DEV__ && console.log('resumeSession', sessionId.toString('hex'))
    next(null, sessionCacheMap.get(sessionId.toString('hex')) || null)
  })
}

const createServerPack = ({ protocol, ...option }) => {
  if (![ 'tcp:', 'tls:', 'http:', 'https:' ].includes(protocol)) throw new Error(`invalid protocol: ${protocol}`)
  const isSecure = [ 'tls:', 'https:' ].includes(protocol)
  option = {
    isSecure,
    protocol,
    port: isSecure ? 443 : 80,
    hostname: '127.0.0.1',
    // https only
    // key: 'BUFFER: KEY.pem', // [optional]
    // cert: 'BUFFER: CERT.pem', // [optional]
    // ca: 'BUFFER: CA.pem', // [optional]
    // SNICallback: (hostname, callback) => callback(null, secureContext), // [optional]
    // dhparam: 'BUFFER: DHPARAM.pem',  // [optional] Diffie-Hellman Key Exchange, generate with `openssl dhparam -dsaparam -outform PEM -out output/path/dh4096.pem 4096`
    ...option
  }
  option.baseUrl = `${protocol}//${option.hostname}:${option.port}`

  const server = protocol === 'tcp:' ? createTCPServer()
    : protocol === 'tls:' ? createTLSServer(option)
      : protocol === 'http:' ? createHttpServer()
        : protocol === 'https:' ? createHttpsServer(option)
          : null

  isSecure && applyServerSessionCache(server)

  const socketSet = new Set()
  server.on('connection', (socket) => {
    __DEV__ && console.log('connection ++')
    socketSet.add(socket)
    socket.once('close', () => {
      __DEV__ && console.log('connection --')
      socketSet.delete(socket)
    })
  })

  return { // call this serverPack
    server,
    socketSet,
    option,
    start: async () => !server.listening && new Promise((resolve, reject) => {
      server.on('error', reject)
      server.listen(option.port, option.hostname.replace(/[[\]]/g, ''), () => {
        server.off('error', reject)
        resolve()
      })
    }),
    stop: async ({ isForce = false } = {}) => server.listening && new Promise((resolve) => {
      server.close(() => resolve())
      if (isForce) { for (const socket of socketSet) socket.destroy() }
    })
  }
}

const DEFAULT_RESPONDER_ERROR = (store, error) => store.setState({ error })
const DEFAULT_RESPONDER_END = responderEnd

const createRequestListener = ({
  responderList = [],
  responderError = DEFAULT_RESPONDER_ERROR,
  responderEnd = DEFAULT_RESPONDER_END
}) => async (request, response) => {
  __DEV__ && console.log(`[request] ${request.method}: ${request.url}`)
  const stateStore = createStateStoreLite({
    time: clock(), // in msec, relative
    error: null // from failed responder
  })
  stateStore.request = request // http.IncomingMessage
  stateStore.response = response // http.ServerResponse
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { await responderError(stateStore, error) }
  await responderEnd(stateStore)
}

const describeServerPack = (
  { baseUrl, protocol, hostname, port },
  title,
  extraList = []
) => indentList(`[${title}]`, [
  ...extraList,
  `baseUrl: '${baseUrl}'`,
  ...(
    (hostname && hostname !== '0.0.0.0' && hostname !== '[::]')
      ? []
      : Object.entries(networkInterfaces())
        .reduce((o, [ interfaceName, interfaceList ]) => {
          interfaceList.forEach(({ address, family, isIPv4 = family === 'IPv4' }) => (hostname.startsWith('[') || isIPv4) && o.push([ isIPv4 ? address : `[${address}]`, interfaceName ]))
          return o
        }, [])
        .map(([ address, interfaceName ]) => `localUrl: '${protocol}//${address}:${port}' [${interfaceName}]`)
  )
].filter(Boolean))

export {
  createServerPack,
  createRequestListener,

  describeServerPack
}
