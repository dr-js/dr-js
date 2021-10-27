import { createServer as createNetServer } from 'net'
import { tryRequireResolve } from 'source/env/tryRequire.js'
import { catchAsync } from 'source/common/error.js'
import { readableStreamToBufferAsync } from 'source/node/data/Stream.js'
import { readTextSync } from 'source/node/fs/File.js'

const DR_BROWSER_FILE_PATH = () => [
  './Dr.browser.js', // maybe after webpack, all file gets merged as `library/output.js`
  '../Dr.browser.js', // relative to `source/env/tryRequire`
  '@dr-js/core/library/Dr.browser.js' // within normal node_module structure
].reduce((o, path) => o || tryRequireResolve(path), null)

let cache = ''
const DR_BROWSER_SCRIPT_TAG = () => {
  if (cache === '') cache = `<script>${readTextSync(DR_BROWSER_FILE_PATH())}</script>`
  return cache
}

// set to non-zero to check if that port is available
const getUnusedPort = (expectPort = 0, hostname = '0.0.0.0') => new Promise((resolve, reject) => {
  const server = createNetServer()
  server.on('error', reject)
  server.listen({ host: hostname, port: expectPort, exclusive: true }, (error) => {
    if (error) return reject(error)
    const { port } = server.address()
    server.close(() => resolve(port))
  })
})

const autoTestServerPort = async (expectPortList, hostname) => {
  for (const expectPort of expectPortList) {
    const { result, error } = await catchAsync(getUnusedPort, expectPort, hostname)
    __DEV__ && error && console.log(`[autoTestServerPort] failed for expectPort: ${expectPort}`, error)
    if (result) return result
  }
  return getUnusedPort(0, hostname) // any random
}

const parseHostString = (host, defaultHostname) => { // for ipv6 should use host like: `[::]:80`
  const hostnameList = host.split(':')
  const port = Number(hostnameList.pop()) || undefined
  const hostname = hostnameList.join(':') || defaultHostname || undefined
  return { hostname, port }
}

const parseCookieString = (cookieString) => cookieString
  .split(';')
  .reduce((o, v) => {
    const [ key, ...valueList ] = v.split('=')
    const value = valueList.join('=').trim()
    if (value !== '') o[ key.trim() ] = value
    return o
  }, {})

const isRequestAborted = (store) => Boolean(store.request.aborted) // client may already drop connection, for long-time queued task

const getRequestParam = (store, key) => {
  const { headers } = store.request
  return (
    headers[ key ] || // from HTTP header
    store.getState().url.searchParams.get(key) || // from Url query // NOTE: url should from ResponderRouter
    (headers[ 'cookie' ] && decodeURIComponent(parseCookieString(headers[ 'cookie' ])[ key ])) || // from HTTP header cookie
    (store.info && getWSProtocolListParam(store.info.protocolList, key)) // for WebSocket UpgradeRequestResponder
  )
}

const getRequestBuffer = (store) => readableStreamToBufferAsync(store.request)

const getRequestJSON = (store) => getRequestBuffer(store).then((buffer) => buffer.length === 0 ? undefined : JSON.parse(String(buffer))) // NOTE: support no body with out error

const getWSProtocolListParam = (protocolList = [], key) => { // to get value from format: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  const header = `${encodeURIComponent(key)}=`
  const protocol = protocolList.find((protocol) => protocol.startsWith(header))
  return protocol && decodeURIComponent(protocol.slice(header.length))
}
const packWSProtocolListParam = (key, value) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`

// only common address, not all is checked, check: https://en.wikipedia.org/wiki/Private_network
const isPrivateAddress = (address) => (
  address === '127.0.0.1' ||
  address === '0.0.0.0' ||

  address === '[::1]' ||
  address === '[::]' ||

  address.startsWith('192.168.') ||
  address.startsWith('127.') ||
  address.startsWith('10.') ||

  address.startsWith('[fc') ||
  address.startsWith('[fd') ||
  address.startsWith('[fe') ||

  address === 'localhost' // technically this is not an ip address
)

export {
  DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG,

  getUnusedPort, autoTestServerPort,
  parseHostString, parseCookieString,
  isRequestAborted,
  getRequestParam, getRequestBuffer, getRequestJSON,
  getWSProtocolListParam, packWSProtocolListParam,
  isPrivateAddress
}
