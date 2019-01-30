import { createServer, Socket } from 'net'

// TODO: no SSL support (HTTPS)
// TODO: no multi target server support (load balancing)

const createTCPProxyServer = ({
  hostname = 'localhost',
  port,
  targetHostname = 'localhost',
  targetPort,
  getTargetOption = (socket) => ({ hostname: targetHostname, port: targetPort }) // can also be used for connection check
}) => {
  const server = createServer()
  const option = { hostname, port, getTargetOption }
  const socketSet = new Set()

  server.on('connection', async (socket) => {
    let preConnectDataList = [] // will be set to null after connect
    const preConnectListener = (data) => preConnectDataList.push(data)

    const socketEndListener = () => {
      socketSet.delete(socket)
      targetSocket.destroy()
    }
    socket.on('error', socketEndListener) // prevent server error
    socket.on('close', socketEndListener)
    socket.on('data', preConnectListener)

    socketSet.add(socket)

    const targetSocket = new Socket()
    const targetSocketEndListener = () => socket.destroy()
    targetSocket.on('error', targetSocketEndListener) // prevent server error
    targetSocket.on('close', targetSocketEndListener)
    targetSocket.on('data', (data) => socket.write(data))

    const targetOption = await getTargetOption(socket)
    targetSocket.connect(targetOption.port, targetOption.hostname, () => {
      for (const data of preConnectDataList) targetSocket.write(data)
      preConnectDataList = null
      socket.removeListener('data', preConnectListener)
      socket.on('data', (data) => targetSocket.write(data))
    })
  })

  return {
    server,
    option,
    socketSet,
    start: async () => !server.listening && new Promise((resolve, reject) => {
      server.on('error', reject)
      server.listen(port, hostname, () => {
        server.removeListener('error', reject)
        resolve()
      })
    }),
    stop: async () => server.listening && new Promise((resolve) => {
      socketSet.forEach((socket) => socket.destroy())
      socketSet.clear()
      server.close(resolve)
    })
  }
}

export { createTCPProxyServer }
