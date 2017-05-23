import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'

import { clock } from 'source/common/time'

import {
  responseReducerLogState,
  responseReducerEnd
} from './ResponseReducer'

const DEFAULT_HTTP_OPTION = {
  port: 80,
  hostName: 'localhost'
}

const DEFAULT_HTTPS_OPTION = {
  port: 443,
  hostName: 'localhost',
  key: 'BUFFER: KEY.pem',
  cert: 'BUFFER: CERT.pem'
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

function createServer (option, type = 'HTTP') {
  const { port, hostName, key, cert } = { ...(type === 'HTTP' ? DEFAULT_HTTP_OPTION : DEFAULT_HTTPS_OPTION), ...option } // set defaults
  const server = type === 'HTTP' ? nodeModuleHttp.createServer() : nodeModuleHttps.createServer({ key, cert })
  const { start, stop } = getServerToggle({ port, hostName }, server)
  return { server, start, stop }
}

const createStateStore = (state) => ({
  getState: () => state,
  setState: (nextState) => (state = { ...state, ...nextState })
})

let totalCount = 0
let currentCount = 0

const applyResponseReducerList = (server, responseReducerList = DEFAULT_RESPONSE_REDUCER_LIST) => server.on(
  'request',
  (request, response) => {
    totalCount++
    currentCount++
    const logTag = `${request.method}: ${request.url} ${totalCount}/${currentCount}`
    // __DEV__ && console.log(`START ==== ${logTag}`)
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
        currentCount--
        __DEV__ && console.log(`END ====== +${(clock() - startTime).toFixed(3)}ms ${response.statusCode} ${logTag}`)
      })
  }
)

export {
  createServer,
  applyResponseReducerList
}
