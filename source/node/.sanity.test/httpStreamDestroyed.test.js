import { createServer, request } from 'http'
import { setTimeoutAsync } from 'source/common/time'
import { strictEqual } from 'source/common/verify'
import { readableStreamToBufferAsync } from 'source/node/data/Stream'
import { getUnusedPort } from 'source/node/server/function'

const { describe, it, info = console.log } = global

process.env.TEST_SANITY && describe('Node.SanityTest.HttpStreamDestroyed', () => {
  it('test inspired by the HTTP `stream.destroyed` change in nodejs v15.5.0', async () => { // check: https://github.com/nodejs/node/issues/36617
    const HOSTNAME = '127.0.0.1'
    const PORT = await getUnusedPort(3000, HOSTNAME)
    const PAYLOAD_BUFFER = Buffer.from('test-'.repeat(64))

    const testNormalPost = () => new Promise((resolve) => {
      info('## testNormalPost ##')

      // basic server
      const httpServer = createServer()
      httpServer.listen(PORT, HOSTNAME)
      httpServer.on('request', async (request, response) => {
        strictEqual(request.socket, response.socket, '[httpServer] should be same socket')
        info('[httpServer] soc/req/res.destroyed', request.socket.destroyed, request.destroyed, response.destroyed)
        const requestBuffer = await readableStreamToBufferAsync(request)
        info('[httpServer] soc/req/res.destroyed read', request.socket.destroyed, request.destroyed, response.destroyed)
        info('[httpServer] requestBuffer.length', requestBuffer.length)
        await setTimeoutAsync(128)
        info('[httpServer] soc/req/res.destroyed wait128', request.socket.destroyed, request.destroyed, response.destroyed)
        strictEqual(request.socket.destroyed, false, 'should not destroy before the response is sent')
        response.end(requestBuffer, () => {
          info('[httpServer] soc/req/res.destroyed end sent', request.socket.destroyed, request.destroyed, response.destroyed)
        })
        info('[httpServer] soc/req/res.destroyed end', request.socket.destroyed, request.destroyed, response.destroyed)
        httpServer.close(() => {
          strictEqual(request.socket.destroyed, true, 'should destroy after server close')
          info('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
          resolve()
        })
      })
      info('[httpServer] created')

      // POST request
      const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
      httpRequest.on('response', async (httpResponse) => {
        strictEqual(httpRequest.socket, httpResponse.socket, '[httpRequest] should be same socket')
        info('- [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
        const responseBuffer = await readableStreamToBufferAsync(httpResponse)
        info('- [httpRequest] soc/req/res.destroyed read', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
        info('- [httpRequest] responseBuffer.length', responseBuffer.length)
        strictEqual(httpRequest.socket.destroyed, false, 'should not destroy before the response is sent')
      })
      httpRequest.end(PAYLOAD_BUFFER)
      info('- [httpRequest] created')
    })

    const testClientClose = () => new Promise((resolve) => {
      info('## testClientClose ##')

      // basic server
      const httpServer = createServer()
      httpServer.listen(PORT, HOSTNAME)
      httpServer.on('request', async (request, response) => {
        info('[httpServer] soc/req/res.destroyed', request.socket.destroyed, request.destroyed, response.destroyed)
        const requestBuffer = await readableStreamToBufferAsync(request)
        info('[httpServer] soc/req/res.destroyed read', request.socket.destroyed, request.destroyed, response.destroyed)
        info('[httpServer] requestBuffer.length', requestBuffer.length)
        await setTimeoutAsync(128)
        strictEqual(httpRequest.socket.destroyed, true, 'should destroy since the client dropped')
        info('[httpServer] soc/req/res.destroyed wait128', request.socket.destroyed, request.destroyed, response.destroyed)
        response.end(requestBuffer)
        info('[httpServer] soc/req/res.destroyed end', request.socket.destroyed, request.destroyed, response.destroyed)
        httpServer.close(() => {
          info('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
          resolve()
        })
      })
      info('[httpServer] created')

      // POST request
      const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
      httpRequest.on('response', async (httpResponse) => {
        info('- [SHOULD NOT REACH THIS] [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
      })
      httpRequest.end(PAYLOAD_BUFFER)
      httpRequest.on('error', (error) => {
        info('- [httpRequest] soc/req.destroyed error', httpRequest.socket.destroyed, httpRequest.destroyed)
        info('- [httpRequest] error', error.message)
      })
      setTimeoutAsync(64).then(() => {
        info('- [httpRequest] httpRequest.destroy!')
        httpRequest.destroy()
        info('- [httpRequest] soc/req.destroyed destroy', httpRequest.socket.destroyed, httpRequest.destroyed)
      })
      info('- [httpRequest] created')
    })

    const testServerClose = () => new Promise((resolve) => {
      info('## testServerClose ##')

      // basic server
      const httpServer = createServer()
      httpServer.listen(PORT, HOSTNAME)
      httpServer.on('request', async (request, response) => {
        info('[httpServer] request.destroy!')
        request.destroy()
        info('[httpServer] soc/req/res.destroyed destroy', request.socket.destroyed, request.destroyed, response.destroyed)
        httpServer.close(() => {
          info('[httpServer] soc/req/res.destroyed close', request.socket.destroyed, request.destroyed, response.destroyed)
          resolve()
        })
      })
      info('[httpServer] created')

      // POST request
      const httpRequest = request(`http://${HOSTNAME}:${PORT}`, { method: 'POST' })
      httpRequest.on('response', async (httpResponse) => {
        info('- [SHOULD NOT REACH THIS] [httpRequest] soc/req/res.destroyed', httpRequest.socket.destroyed, httpRequest.destroyed, httpResponse.destroyed)
      })
      httpRequest.end(PAYLOAD_BUFFER)
      httpRequest.on('error', (error) => {
        info('- [httpRequest] soc/req.destroyed error', httpRequest.socket.destroyed, httpRequest.destroyed)
        info('- [httpRequest] error', error.message)
      })
      info('- [httpRequest] created')
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
