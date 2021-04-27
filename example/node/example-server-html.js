const { BASIC_EXTENSION_MAP } = require('../../output-gitignore/library/common/module/MIME')
const { responderSendBufferCompress, prepareBufferData } = require('../../output-gitignore/library/node/server/Responder/Send')
const { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } = require('../../output-gitignore/library/common/module/HTML')

const createExampleServerHTMLResponder = () => {
  const bufferData = prepareBufferData(Buffer.from(COMMON_LAYOUT([
    '<title>Example Server</title>',
    COMMON_STYLE()
  ], [
    COMMON_SCRIPT({ onload: mainScriptInit })
  ])), BASIC_EXTENSION_MAP.html)
  return (store) => responderSendBufferCompress(store, bufferData)
}

const mainScriptInit = () => {
  const {
    document, location, WebSocket,
    qS, cE, aCL
  } = window

  aCL(document.body, [
    cE('button', { innerText: 'createWebSocket', onclick: () => createWebSocket() }),
    cE('button', { innerText: 'testWebSocket', onclick: () => testWebSocket() }),
    cE('button', { innerText: 'closeWebSocket', onclick: () => closeWebSocket() }),
    cE('pre', { id: 'log', innerText: 'LOG' }),
    cE('button', { innerText: 'clear Log', onclick: () => qS('#log', '') })
  ])

  const log = (...args) => {
    console.log(...args)
    qS('#log').innerHTML += '\n' + args.join(' ')
  }

  const createWebSocket = () => {
    closeWebSocket()
    const socket = new WebSocket(
      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`,
      [ 'json', 'a', 'b', encodeURIComponent('auth-token!0123ABCD') ]
    )
    socket.addEventListener('open', (event) => log('open', socket, event))
    socket.addEventListener('error', (event) => log('error', event))
    socket.addEventListener('close', (event) => log('close', event))
    socket.addEventListener('message', (event) => log('message', event, typeof (event.data), typeof (event.data) === 'string' ? event.data.length : event.data.size))
    setCurrentSocket(socket)
  }

  const testWebSocket = () => {
    const socket = getCurrentSocket()
    if (!socket) return
    if (socket.readyState !== WebSocket.OPEN) return log(`[testWebSocket] wrong readyState ${socket.readyState}`)
    socket.send('[TEXT]123!@#abc<>\\\n!@#$%^&*()_+')
    socket.send(document.body.innerHTML)
    socket.send('BIG STRING')
    socket.send('BIG BUFFER')
  }

  const closeWebSocket = () => {
    const socket = getCurrentSocket()
    if (!socket) return
    if (socket.readyState !== WebSocket.OPEN) return log(`[closeWebSocket] wrong readyState ${socket.readyState}`)
    socket.send('CLOSE')
    setCurrentSocket(null)
  }

  let currentSocket = null
  const setCurrentSocket = (socket) => (currentSocket = socket)
  const getCurrentSocket = () => currentSocket
}

module.exports = { createExampleServerHTMLResponder }
