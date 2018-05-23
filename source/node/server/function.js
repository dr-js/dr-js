import { createServer as createNetServer } from 'net'

const parseCookieString = (cookieString) => cookieString
  .split(';')
  .reduce((o, v) => {
    const [ key, ...valueList ] = v.split('=')
    const value = valueList.join('=').trim()
    if (value !== '') o[ key.trim() ] = value
    return o
  }, {})

// set to non-zero to check if that port is available
const getUnusedPort = (expectPort = 0, host = '0.0.0.0') => new Promise((resolve, reject) => {
  const server = createNetServer()
  server.on('error', reject)
  server.listen({ host, port: expectPort, exclusive: true }, (error) => {
    if (error) return reject(error)
    const { port } = server.address()
    server.close(() => resolve(port))
  })
})

export {
  parseCookieString,
  getUnusedPort
}
