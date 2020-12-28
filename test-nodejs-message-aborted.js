console.log(`## TEST ENV ${process.version} ${process.platform} ${process.arch} ##`)

// test for the HTTP `http.ClientRequest.aborted|http.IncomingMessage.aborted` behavior in nodejs v15.5.0

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

const testClientRequestAbort = () => new Promise((resolve) => {
  log('## testClientRequestAbort ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    request.on('abort', () => {
      log('[httpServer|req-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    request.on('close', () => {
      log('[httpServer|req-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('abort', () => {
      log('[httpServer|res-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('close', () => {
      log('[httpServer|res-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    log('[httpServer|init] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    await setTimeoutAsync(128)
    log('[httpServer|w128] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    httpServer.close(() => {
      log('[httpServer|done] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    log('- [httpRequest|init] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    await setTimeoutAsync(128)
    log('- [httpRequest|w128] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
  })
  httpRequest.on('abort', () => {
    log('- [httpRequest|abrt] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.on('close', () => {
    log('- [httpRequest|clse] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.on('error', () => {
    log('- [httpRequest|errr] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  log('- [httpRequest] created')
  log('- [httpRequest|crtd] soc/req.destroyed | req.aborted', httpRequest.socket ? httpRequest.socket.destroyed : 'no-soc', httpRequest.destroyed, '|', httpRequest.aborted)
  setTimeoutAsync(64).then(() => {
    log('- [httpRequest|wa64] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
    httpRequest.abort()
    log('- [httpRequest|abrt!] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
})

const testClientRequestDestroy = () => new Promise((resolve) => {
  log('## testClientRequestDestroy ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    request.on('abort', () => {
      log('[httpServer|req-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    request.on('close', () => {
      log('[httpServer|req-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('abort', () => {
      log('[httpServer|res-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('close', () => {
      log('[httpServer|res-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    log('[httpServer|init] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    await setTimeoutAsync(128)
    log('[httpServer|w128] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    httpServer.close(() => {
      log('[httpServer|done] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    log('- [httpRequest|init] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    await setTimeoutAsync(128)
    log('- [httpRequest|w128] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
  })
  httpRequest.on('abort', () => {
    log('- [httpRequest|abrt] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.on('close', () => {
    log('- [httpRequest|clse] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.on('error', () => {
    log('- [httpRequest|errr] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  log('- [httpRequest] created')
  log('- [httpRequest|crtd] soc/req.destroyed | req.aborted', httpRequest.socket ? httpRequest.socket.destroyed : 'no-soc', httpRequest.destroyed, '|', httpRequest.aborted)
  setTimeoutAsync(64).then(() => {
    log('- [httpRequest|wa64] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
    httpRequest.destroy()
    log('- [httpRequest|dsty!] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
})

const testClientRequestLateAbort = () => new Promise((resolve) => {
  log('## testClientRequestLateAbort ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    request.on('abort', () => {
      log('[httpServer|req-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    request.on('close', () => {
      log('[httpServer|req-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('abort', () => {
      log('[httpServer|res-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('close', () => {
      log('[httpServer|res-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    log('[httpServer|init] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    const requestBuffer = await readableStreamToBufferAsync(request)
    log('[httpServer|read] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    response.end(requestBuffer)
    log('[httpServer|send] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    await setTimeoutAsync(128)
    log('[httpServer|w128] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    httpServer.close(() => {
      log('[httpServer|done] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    httpRequest.on('abort', () => {
      log('- [httpRequest|abrt] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    httpRequest.on('close', () => {
      log('- [httpRequest|clse] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    httpRequest.on('error', () => {
      log('- [httpRequest|errr] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    log('- [httpRequest|init] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    httpRequest.abort()
    log('- [httpRequest|abrt!] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    await setTimeoutAsync(64)
    log('- [httpRequest|wa64+64] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  log('- [httpRequest] created')
  log('- [httpRequest|crtd] soc/req.destroyed | req.aborted', httpRequest.socket ? httpRequest.socket.destroyed : 'no-soc', httpRequest.destroyed, '|', httpRequest.aborted)
  setTimeoutAsync(64).then(() => {
    log('- [httpRequest|wa64] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
})

const testClientRequestLateDestroy = () => new Promise((resolve) => {
  log('## testClientRequestLateDestroy ##')

  // basic server
  const httpServer = createServer()
  httpServer.listen(PORT, HOSTNAME)
  httpServer.on('request', async (request, response) => {
    request.on('abort', () => {
      log('[httpServer|req-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    request.on('close', () => {
      log('[httpServer|req-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('abort', () => {
      log('[httpServer|res-abrt] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    response.on('close', () => {
      log('[httpServer|res-clse] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    })
    log('[httpServer|init] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    const requestBuffer = await readableStreamToBufferAsync(request)
    log('[httpServer|read] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    response.end(requestBuffer)
    log('[httpServer|send] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    await setTimeoutAsync(128)
    log('[httpServer|w128] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
    httpServer.close(() => {
      log('[httpServer|done] soc/req/res.destroyed | req/res.aborted', request.socket.destroyed, request.destroyed, response.destroyed, '|', request.aborted, response.aborted)
      resolve()
    })
  })
  log('[httpServer] created')

  // POST request
  const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
  httpRequest.on('response', async (httpResponse) => {
    httpRequest.on('abort', () => {
      log('- [httpRequest|abrt] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    httpRequest.on('close', () => {
      log('- [httpRequest|clse] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    httpRequest.on('error', () => {
      log('- [httpRequest|errr] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    })
    log('- [httpRequest|init] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    httpRequest.destroy()
    log('- [httpRequest|dsty!] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
    await setTimeoutAsync(64)
    log('- [httpRequest|wa64+64] soc/req/res.destroyed | req/res.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed, '|', httpRequest.aborted, httpResponse.aborted)
  })
  httpRequest.end(PAYLOAD_BUFFER)
  log('- [httpRequest] created')
  log('- [httpRequest|crtd] soc/req.destroyed | req.aborted', httpRequest.socket ? httpRequest.socket.destroyed : 'no-soc', httpRequest.destroyed, '|', httpRequest.aborted)
  setTimeoutAsync(64).then(() => {
    log('- [httpRequest|wa64] soc/req.destroyed | req.aborted', httpRequest.socket.destroyed, httpRequest.destroyed, '|', httpRequest.aborted)
  })
})

const wait32 = () => setTimeoutAsync(32)
Promise.resolve()
  .then(testClientRequestAbort).then(wait32)
  .then(testClientRequestDestroy).then(wait32)
  .then(testClientRequestLateAbort).then(wait32)
  .then(testClientRequestLateDestroy).then(wait32)
  // repeat
  .then(testClientRequestAbort).then(wait32)
  .then(testClientRequestDestroy).then(wait32)
  .then(testClientRequestLateAbort).then(wait32)
  .then(testClientRequestLateDestroy).then(wait32)
