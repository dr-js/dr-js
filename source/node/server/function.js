import { readFileSync } from 'fs'
import { createServer as createNetServer } from 'net'
import { catchAsync } from 'source/common/error.js'
import { tryRequireResolve } from 'source/env/tryRequire.js'

const DR_BROWSER_FILE_PATH = () => [
  './Dr.browser.js', // maybe after webpack, all file gets merged as `library/output.js`
  '../Dr.browser.js', // relative to `source/env/tryRequire`
  '@dr-js/core/library/Dr.browser.js' // within normal node_module structure
].reduce((o, path) => o || tryRequireResolve(path), null)

let cache = ''
const DR_BROWSER_SCRIPT_TAG = () => {
  if (cache === '') cache = `<script>${readFileSync(DR_BROWSER_FILE_PATH())}</script>`
  return cache
}

const parseCookieString = (cookieString) => cookieString // TODO: DEPRECATE: move to `@dr-js/node`
  .split(';')
  .reduce((o, v) => {
    const [ key, ...valueList ] = v.split('=')
    const value = valueList.join('=').trim()
    if (value !== '') o[ key.trim() ] = value
    return o
  }, {})

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

export {
  DR_BROWSER_FILE_PATH, DR_BROWSER_SCRIPT_TAG,

  parseCookieString, // TODO: DEPRECATE: move to `@dr-js/node`
  getUnusedPort,
  autoTestServerPort
}
