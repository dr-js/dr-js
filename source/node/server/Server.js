import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { constants } from 'crypto'

import { clock } from 'source/common/time'
import { CacheMap } from 'source/common/data'

import {
  responseReducerLogState,
  responseReducerEnd
} from './ResponseReducer'

const SSL_SESSION_CACHE_MAX = 5000
const SSL_SESSION_EXPIRE_TIME = 5 * 60 * 1000 // in msec, 5min

const DEFAULT_HTTPS_OPTION = {
  port: 443,
  hostName: 'localhost',
  key: 'BUFFER: KEY.pem',
  cert: 'BUFFER: CERT.pem',
  ca: 'BUFFER: CA.pem',
  dhparam: 'BUFFER: DHPARAM.pem', // Diffie-Hellman Key Exchange
  secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2 // https://taylorpetrick.com/blog/post/https-nodejs-letsencrypt
}

const DEFAULT_HTTP_OPTION = {
  port: 80,
  hostName: 'localhost'
}

const DEFAULT_RESPONSE_REDUCER_LIST = __DEV__ ? [ responseReducerLogState ] : []

const getServerToggle = ({ port, hostName }, server) => ({
  start: () => {
    !server.listening && server.listen(port, hostName)
    __DEV__ && !server.listening && console.log('Server running at port', port, 'hostName', hostName)
  },
  stop: () => {
    server.listening && server.close()
    __DEV__ && server.listening && console.log('Server stopped')
  }
})

function createServer (option, type = 'HTTPS') {
  const { port, hostName, key, cert } = { ...(type === 'HTTPS' ? DEFAULT_HTTPS_OPTION : DEFAULT_HTTP_OPTION), ...option } // set defaults
  const server = type === 'HTTPS' ? nodeModuleHttps.createServer({ key, cert }) : nodeModuleHttp.createServer()
  const { start, stop } = getServerToggle({ port, hostName }, server)
  if (type === 'HTTPS') {
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
  return { server, start, stop }
}

const createStateStore = (state) => ({
  getState: () => state,
  setState: (nextState) => (state = { ...state, ...nextState })
})

const applyResponseReducerList = (server, responseReducerList = DEFAULT_RESPONSE_REDUCER_LIST) => {
  let totalResponseCount = 0
  let currentResponseCount = 0
  return server.on(
    'request',
    (request, response) => {
      __DEV__ && totalResponseCount++
      __DEV__ && currentResponseCount++
      __DEV__ && console.log(`START ==== ${request.method}: ${request.url} ${totalResponseCount}/${currentResponseCount}`)
      const startTime = clock()
      const stateStore = Object.assign(createStateStore(), { request, response })
      responseReducerList.reduce(
        (promiseTail, responseReducer) => {
          // __DEV__ && console.log(`REDUCE +${(clock() - startTime).toFixed(3)}ms`)
          return promiseTail.then(responseReducer)
        },
        Promise.resolve(stateStore)
      )
        .catch((error) => {
          stateStore.setState({ error })
          return stateStore
        })
        .then(responseReducerEnd)
        .then(() => {
          __DEV__ && currentResponseCount--
          __DEV__ && console.log(`END ====== +${(clock() - startTime).toFixed(3)}ms ${response.statusCode}`)
        })
    }
  )
}

export {
  createServer,
  applyResponseReducerList
}
