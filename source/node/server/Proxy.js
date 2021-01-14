import { connect as TCPConnect } from 'net'
import { connect as TLSConnect } from 'tls'

// TODO: no multi target server support (load balancing)

// Usage:
//   server.on('connection', createTCPProxyListener({ ... }))
const createTCPProxyListener = ({
  isSecure = false,
  getTargetOption = (socket) => ({ hostname: '127.0.0.1', port: 80 }) // can also be used for connection check
}) => async (socket) => {
  let preConnectDataList = [] // will be set to null after connect
  const preConnectListener = (data) => preConnectDataList.push(data)
  socket.on('data', preConnectListener)

  const socketEndListener = () => targetSocket.destroy()
  socket.on('error', socketEndListener) // prevent server error
  socket.on('close', socketEndListener)

  const option = await getTargetOption(socket)
  if (option.host === undefined) option.host = option.hostname // NOTE: patch option format
  const targetSocket = (isSecure ? TLSConnect : TCPConnect)(option, () => {
    for (const data of preConnectDataList) targetSocket.write(data)
    preConnectDataList = null
    socket.off('data', preConnectListener)
    socket.on('data', (data) => targetSocket.write(data))
  })
  const targetSocketEndListener = () => socket.destroy()
  targetSocket.on('error', targetSocketEndListener) // prevent server error
  targetSocket.on('close', targetSocketEndListener)
  targetSocket.on('data', (data) => socket.write(data))
}

export { createTCPProxyListener }
