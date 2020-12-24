console.log(`## TEST ENV ${process.version} ${process.platform} ${process.arch} ##`)

// test for the HTTP `stream.destroyed` change in nodejs v15.5.0

const { createServer, request } = require('http')

const readableStreamToBufferAsync = (readableStream) => new Promise((resolve, reject) => { // the stream is handled
  const data = []
  readableStream.on('error', reject)
  readableStream.on('close', () => reject(new Error('unexpected stream close'))) // for close before end, should already resolved for normal close
  readableStream.on('end', () => resolve(Buffer.concat(data)))
  readableStream.on('data', (chunk) => data.push(chunk))
})
const setTimeoutAsync = (wait = 0) => new Promise((resolve) => setTimeout(resolve, wait))
const log = (...args) => console.log(...args) // const log = (...args) => console.log(new Date().toISOString(), ...args) // NOTE: for log time to debug

const HOSTNAME = '127.0.0.1'
const PORT = 3000
const PAYLOAD_BUFFER = Buffer.from('test-'.repeat(64))

const testNormalPost = () => new Promise((resolve) => {
  log('## testNormalPost ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    log('[httpServer] same socket', request.socket === response.socket)
    log('[httpServer] soc/req/res.destroyed', request.socket.destroyed, request.destroyed, response.destroyed)
    const requestBuffer = await readableStreamToBufferAsync(request)
    log('[httpServer] soc/req/res.destroyed read', request.socket.destroyed, request.destroyed, response.destroyed)
    log('[httpServer] requestBuffer.length', requestBuffer.length)
    await setTimeoutAsync(128)
    log('[httpServer] soc/req/res.destroyed wait128', request.socket.destroyed, request.destroyed, response.destroyed)
    response.end(requestBuffer)
    log('[httpServer] soc/req/res.destroyed end', request.socket.destroyed, request.destroyed, response.destroyed)
    httpServer.close(() => {
      log('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    log('- [httpRequest] same socket', httpRequest.socket === httpResponse.socket)
    log('- [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
    const responseBuffer = await readableStreamToBufferAsync(httpResponse)
    log('- [httpRequest] soc/req/res.destroyed read', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
    log('- [httpRequest] responseBuffer.length', responseBuffer.length)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  log('- [httpRequest] created')
})

const testClientClose = () => new Promise((resolve) => {
  log('## testClientClose ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    log('[httpServer] soc/req/res.destroyed', request.socket.destroyed, request.destroyed, response.destroyed)
    const requestBuffer = await readableStreamToBufferAsync(request)
    log('[httpServer] soc/req/res.destroyed read', request.socket.destroyed, request.destroyed, response.destroyed)
    log('[httpServer] requestBuffer.length', requestBuffer.length)
    await setTimeoutAsync(128)
    log('[httpServer] soc/req/res.destroyed wait128', request.socket.destroyed, request.destroyed, response.destroyed)
    response.end(requestBuffer)
    log('[httpServer] soc/req/res.destroyed end', request.socket.destroyed, request.destroyed, response.destroyed)
    httpServer.close(() => {
      log('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    log('- [SHOULD NOT REACH THIS] [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  httpRequest.on('error', (error) => {
    log('- [httpRequest] soc/req.destroyed error', httpRequest.socket.destroyed, httpRequest.destroyed)
    log('- [httpRequest] error', error.message)
  })
  setTimeoutAsync(64).then(() => {
    log('- [httpRequest] httpRequest.destroy!')
    httpRequest.destroy()
    log('- [httpRequest] soc/req.destroyed destroy', httpRequest.socket.destroyed, httpRequest.destroyed)
  })
  log('- [httpRequest] created')
})

const testServerClose = () => new Promise((resolve) => {
  log('## testServerClose ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    log('[httpServer] request.destroy!')
    request.destroy()
    log('[httpServer] soc/req/res.destroyed destroy', request.socket.destroyed, request.destroyed, response.destroyed)
    httpServer.close(() => {
      log('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    log('- [SHOULD NOT REACH THIS] [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  httpRequest.on('error', (error) => {
    log('- [httpRequest] soc/req.destroyed error', httpRequest.socket.destroyed, httpRequest.destroyed)
    log('- [httpRequest] error', error.message)
  })
  log('- [httpRequest] created')
})

const wait32 = () => setTimeoutAsync(32)
Promise.resolve()
  .then(testNormalPost).then(wait32)
  .then(testClientClose).then(wait32)
  .then(testServerClose).then(wait32)
  // repeat
  .then(testNormalPost).then(wait32)
  .then(testClientClose).then(wait32)
  .then(testServerClose).then(wait32)
