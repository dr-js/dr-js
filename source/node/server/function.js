import { catchAsync } from 'source/common/error'
import { createServer as createNetServer } from 'net'

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
  getUnusedPort,
  autoTestServerPort
}
