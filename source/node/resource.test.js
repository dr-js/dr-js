import { resolve } from 'path'
import { unlinkSync, writeFileSync } from 'fs'
import { getUnusedPort } from 'source/node/server/function'
import { createServer, createRequestListener } from 'source/node/server/Server'
import { createResponderParseURL } from 'source/node/server/Responder/Common'
import { responderSendBuffer, responderSendJSON } from 'source/node/server/Responder/Send'
import { createRouteMap, createResponderRouter } from 'source/node/server/Responder/Router'
import {
  loadRemoteScript, loadLocalScript, loadScript,
  loadRemoteJSON, loadLocalJSON, loadJSON
} from './resource'

const { describe, it, before, after } = global

const BUFFER_SCRIPT = Buffer.from(`{
  // Simple script file, used for js test
  const a = async (b = 0) => b + 1
  a().then((result) => { if (result !== 1) throw new Error('unexpected result: ' + result) })
}`)
const SOURCE_JSON = resolve(__dirname, '../../package.json')
const SOURCE_SCRIPT = resolve(__dirname, './test-resource-script-gitignore.js')

const withTestServer = (asyncTest) => async () => {
  const { server, start, stop, option } = createServer({ protocol: 'http:', hostname: 'localhost', port: await getUnusedPort() })
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderRouter(createRouteMap([
        [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ],
        [ '/test-script', 'GET', async (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ]
      ]))
    ]
  }))
  start()
  await asyncTest(option.baseUrl)
  stop()
}

before('prepare', () => {
  writeFileSync(SOURCE_SCRIPT, BUFFER_SCRIPT)
})

after('clear', () => {
  unlinkSync(SOURCE_SCRIPT)
})

describe('Node.Resource', () => {
  it('loadRemoteScript()', withTestServer(async (serverUrl) => {
    await loadRemoteScript(`${serverUrl}/test-script`)
  }))
  it('loadLocalScript()', async () => {
    await loadLocalScript(SOURCE_SCRIPT)
  })
  it('loadScript()', withTestServer(async (serverUrl) => {
    await loadScript(SOURCE_SCRIPT)
    await loadScript(`${serverUrl}/test-script`)
  }))

  it('loadLocalJSON()', async () => {
    await loadLocalJSON(SOURCE_JSON)
  })
  it('loadRemoteJSON()', withTestServer(async (serverUrl) => {
    await loadRemoteJSON(`${serverUrl}/test-json`)
  }))
  it('loadJSON()', withTestServer(async (serverUrl) => {
    await loadJSON(SOURCE_JSON)
    await loadJSON(`${serverUrl}/test-json`)
  }))
})
