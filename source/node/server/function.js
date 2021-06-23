import { createServer as createNetServer } from 'net'
import { catchAsync } from 'source/common/error.js'

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
  parseCookieString, // TODO: DEPRECATE: move to `@dr-js/node`
  getUnusedPort,
  autoTestServerPort
}
