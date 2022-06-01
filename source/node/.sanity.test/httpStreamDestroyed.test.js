import { createServer, request } from 'node:http'
import { setTimeoutAsync } from 'source/common/time.js'
import { strictEqual, truthy } from 'source/common/verify.js'
import { readableStreamToBufferAsync } from 'source/node/data/Stream.js'
import { getUnusedPort } from 'source/node/server/function.js'

const { describe, it, info = console.log } = globalThis
const log = __DEV__ ? info : () => {}

process.env.TEST_SANITY && describe('Node.SanityTest.HttpStreamDestroyed', () => {
  it('test inspired by the HTTP `stream.destroyed` change in nodejs v15.5.0', async () => { // check: https://github.com/nodejs/node/issues/36617
    const HOSTNAME = '127.0.0.1'
    const PORT = await getUnusedPort(3000, HOSTNAME)
    const PAYLOAD_BUFFER = Buffer.from('test-'.repeat(64))

    const testNormalPost = () => new Promise((resolve) => {
      log('## testNormalPost ##')

      // basic server
      const httpServer = createServer()
      httpServer.listen(PORT, HOSTNAME)
      httpServer.on('request', async (request, response) => {
        strictEqual(request.socket, response.socket, '[httpServer] should be same socket')
        log('[httpServer] soc/req/res.destroyed', request.socket.destroyed, request.destroyed, response.destroyed)
        const requestBuffer = await readableStreamToBufferAsync(request)
        log('[httpServer] soc/req/res.destroyed read', request.socket.destroyed, request.destroyed, response.destroyed)
        log('[httpServer] requestBuffer.length', requestBuffer.length)
        await setTimeoutAsync(128)
        log('[httpServer] soc/req/res.destroyed wait128', request.socket.destroyed, request.destroyed, response.destroyed)
        truthy(!request.socket.destroyed, 'should not destroy before the response is sent')
        response.end(requestBuffer, () => {
          log('[httpServer] soc/req/res.destroyed end sent', request.socket.destroyed, request.destroyed, response.destroyed)
        })
        log('[httpServer] soc/req/res.destroyed end', request.socket.destroyed, request.destroyed, response.destroyed)
        httpServer.close(() => {
          truthy(request.socket.destroyed, 'should destroy after server close')
          log('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
          resolve()
        })
      })
      log('[httpServer] created')

      // POST request
      const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
      httpRequest.on('response', async (httpResponse) => {
        strictEqual(httpRequest.socket, httpResponse.socket, '[httpRequest] should be same socket')
        log('- [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
        const responseBuffer = await readableStreamToBufferAsync(httpResponse)
        log('- [httpRequest] soc/req/res.destroyed read', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
        log('- [httpRequest] responseBuffer.length', responseBuffer.length)
        truthy(!httpRequest.socket.destroyed, 'should not destroy before the response is sent')
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
        truthy(httpRequest.socket.destroyed, 'should destroy since the client dropped')
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
    await Promise.resolve()
      .then(testNormalPost).then(wait32)
      .then(testClientClose).then(wait32)
      .then(testServerClose).then(wait32)
      // repeat
      .then(testNormalPost).then(wait32)
      .then(testClientClose).then(wait32)
      .then(testServerClose).then(wait32)
  })
})
