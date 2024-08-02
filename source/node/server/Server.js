import { networkInterfaces } from 'node:os'
import { randomBytes } from 'node:crypto'
import { createServer as createTCPServer } from 'node:net'
import { createServer as createTLSServer } from 'node:tls'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'

import { clock } from 'source/common/time.js'
import { isNumber, isBasicArray, isBasicObject } from 'source/common/check.js'
import { prettyStringifyConfigObject } from 'source/common/format.js'
import { createCacheMap2 } from 'source/common/data/CacheMap2.js'
import { createStateStoreLite } from 'source/common/immutable/StateStore.js'
import { objectFromEntries } from 'source/common/immutable/Object.js'
import { responderError, responderEnd } from './Responder/Common.js'

// TODO: add HTTP2 or just skip to HTTP3?

const SESSION_CLIENT_TIMEOUT_SEC = 4 * 60 * 60 // in sec, 4hour
const SESSION_CACHE_MAX = 4 * 1024
const SESSION_CACHE_EXPIRE_TIME = 10 * 60 * 1000 // in msec, 10min
const SESSION_TICKET_ROTATE_TIME = 4 * 60 * 60 * 1000 // in msec, 4hour

/** @typedef { import('node:net').Server | import('node:http').Server } ServerNonSecure */
/** @typedef { import('node:tls').Server | import('node:https').Server } ServerSecure */
/** @typedef { ServerNonSecure | ServerSecure } ServerBase */

/** @type { (server: ServerSecure ) => void } */
const applyServerSessionCache = (server) => { // TODO: consider move to `ticketKeys`: https://nodejs.org/dist/latest-v12.x/docs/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
  const sessionCacheMap = createCacheMap2({ sizeMax: SESSION_CACHE_MAX, expireAfter: SESSION_CACHE_EXPIRE_TIME })
  server.on('newSession', (sessionId, sessionData, next) => {
    __DEV__ && console.log('newSession', sessionId.toString('base64'))
    sessionCacheMap.set(sessionId.toString('base64'), sessionData)
    next()
  })
  server.on('resumeSession', (sessionId, next) => {
    __DEV__ && console.log('resumeSession', sessionId.toString('base64'))
    next(null, sessionCacheMap.get(sessionId.toString('base64')) || null)
  })
}

// NOTE: server is packed as Exot, and some feature can also have Exot,
//   then managed as ExotGroup alone with serverExot,
//   this make the life cycle simpler and the server close step more reasonable
const createServerExot = ({
  id = 'server',
  protocol,
  skipSessionPatch = false, // allow disable the session ticket rotation patch (check below comment)
  forceCloseTimeout = 2 * 1000, // default wait 2sec max for on-going connection to end, set to Infinity to wait on
  ...option
}) => {
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
    // sessionTimeout: SESSION_CLIENT_TIMEOUT_SEC, // [optional] in seconds, for both session cache and ticket
    // ticketKeys: 'BUFFER to reuse, 48byte', // [optional] check: https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener // and: https://github.com/nodejs/node/issues/27167
    ...(isSecure && !skipSessionPatch && { sessionTimeout: SESSION_CLIENT_TIMEOUT_SEC }),
    ...option
  }
  option.baseUrl = `${protocol}//${option.hostname}:${option.port}`

  /** @type { ServerSecure | undefined } */
  const serverSec = isSecure ? (protocol === 'tls:' ? createTLSServer(option) : createHttpsServer(option)) : undefined
  /** @type { ServerBase } */
  const server = serverSec || (protocol === 'tcp:' ? createTCPServer() : createHttpServer())

  serverSec && !skipSessionPatch && applyServerSessionCache(serverSec)

  const socketSet = new Set()
  server.on('connection', (socket) => {
    __DEV__ && console.log('connection ++')
    socketSet.add(socket)
    socket.once('close', () => {
      __DEV__ && console.log('connection --')
      socketSet.delete(socket)
    })
  })

  let sessionTicketRotateToken

  return {
    id,
    up: async () => !server.listening && new Promise((resolve, reject) => {
      server.on('error', reject)
      server.listen(option.port, option.hostname.replace(/[[\]]/g, ''), () => {
        server.off('error', reject)
        if (serverSec && !skipSessionPatch) {
          // ## session ticket rotation patch
          // session ticket without rotation will still work, but is less safe
          // https://blog.filippo.io/we-need-to-talk-about-session-tickets/
          // https://timtaubert.de/blog/2017/02/the-future-of-session-resumption/
          const resetSessionTicketKey = () => serverSec.setTicketKeys(randomBytes(48))
          sessionTicketRotateToken && clearInterval(sessionTicketRotateToken)
          sessionTicketRotateToken = setInterval(resetSessionTicketKey, SESSION_TICKET_ROTATE_TIME)
          resetSessionTicketKey()
        }
        resolve()
      })
    }),
    down: async () => server.listening && new Promise((resolve) => {
      sessionTicketRotateToken && clearInterval(sessionTicketRotateToken)
      const forceCloseToken = isNumber(forceCloseTimeout) && forceCloseTimeout !== Infinity && setTimeout(() => { for (const socket of socketSet) socket.destroy() }, forceCloseTimeout)
      server.close(() => {
        forceCloseToken && clearTimeout(forceCloseToken)
        resolve()
      })
    }),
    isUp: () => server.listening,
    server,
    option,
    socketSet
  }
}

const DEFAULT_RESPONDER_ERROR = responderError
const DEFAULT_RESPONDER_END = responderEnd

/** @import { Socket } from 'node:net' */
/** @import { IncomingMessage, ServerResponse } from 'node:http' */
/** @typedef { Error & { status: number } } ErrorWithStatus */
/** @typedef { { time: number, status: number, error: ErrorWithStatus | null } } ConnState */
/** @typedef { { getState: () => ConnState, setState: (nextState: Partial<ConnState>) => ConnState, socket: Socket, request: IncomingMessage, response: ServerResponse } } ConnStore */
/** @typedef { (store: ConnStore, ...ext: any[]) => any | Promise<any> } Responder */

/** @type { (opt: { responderList: Responder[], responderError?: Responder, responderEnd?: Responder }) => (request: IncomingMessage, response: ServerResponse) => Promise<void> } */
const createRequestListener = ({
  responderList = [],
  responderError = DEFAULT_RESPONDER_ERROR,
  responderEnd = DEFAULT_RESPONDER_END
}) => async (request, response) => { // for listen the server `request` event: https://nodejs.org/api/http.html#http_event_request
  __DEV__ && console.log(`[request] ${request.method}: ${request.url}`)
  const store = /** @type { ConnStore } */ (/** @type { unknown } */ createStateStoreLite({
    time: clock(), // in msec, relative to process start
    status: 500, // will send as status code in responderEnd, if header is still not sent
    error: null // populated by failed responder
  }))
  store.socket = request.socket // should be same: `request.socket === response.socket` // net.Socket: https://nodejs.org/api/net.html#net_class_net_socket
  store.request = request // http.IncomingMessage: https://nodejs.org/api/http.html#http_class_http_incomingmessage
  store.response = response // http.ServerResponse: https://nodejs.org/api/http.html#http_class_http_serverresponse
  try {
    for (const responder of responderList) await responder(store)
  } catch (error) { await responderError(store, error) }
  await responderEnd(store)
}

const describeServerOption = (
  { baseUrl, protocol, hostname, port },
  title = 'server',
  extraOption // can be Array or Object
) => `[${title}]\n${prettyStringifyConfigObject({
  pid: process.pid,
  baseUrl,
  ...((hostname && hostname !== '0.0.0.0' && hostname !== '[::]') ? {} : objectFromEntries(
    Object.entries(networkInterfaces())
      .reduce((o, [ interfaceName, interfaceList ]) => {
        interfaceList.forEach((/** @type { (typeof interfaceList)[0] & { isIPv4?: boolean } } */ { address, family, isIPv4 = family === 'IPv4' }) => (hostname.startsWith('[') || isIPv4) && o.push([ isIPv4 ? address : `[${address}]`, interfaceName ]))
        return o
      }, [])
      .map(([ address, interfaceName ]) => [ `localUrl[${interfaceName}]`, `${protocol}//${address}:${port}` ])
  )),
  ...((isBasicArray(extraOption) && extraOption.length) ? { extraOption }
      : isBasicObject(extraOption) ? extraOption
        : {}
  )
}, '  ', '  ')}`

export {
  createServerExot,
  createRequestListener,

  describeServerOption
}
