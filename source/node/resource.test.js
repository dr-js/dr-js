import { resolve } from 'path'
import { unlinkSync, writeFileSync } from 'fs'
import { getUnusedPort } from 'source/node/server/function'
import { createServer, createRequestListener } from 'source/node/server/Server'
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
  const { server, start, stop, option: { baseUrl } } = createServer({ protocol: 'http:', hostname: 'localhost', port: await getUnusedPort() })
  server.on('request', createRequestListener({
    responderList: [
      createResponderRouter({
        routeMap: createRouteMap([
          [ '/test-json', 'GET', (store) => responderSendJSON(store, { object: { testKey: 'testValue' } }) ],
          [ '/test-script', 'GET', async (store) => responderSendBuffer(store, { buffer: BUFFER_SCRIPT }) ]
        ]),
        baseUrl
      })
    ]
  }))
  await start()
  await asyncTest(baseUrl)
  await stop()
}

before('prepare', () => {
  writeFileSync(SOURCE_SCRIPT, BUFFER_SCRIPT)
})

after('clear', () => {
  unlinkSync(SOURCE_SCRIPT)
})

describe('Node.Resource', () => {
  it('loadRemoteScript()', withTestServer(async (baseUrl) => {
    await loadRemoteScript(`${baseUrl}/test-script`)
  }))
  it('loadLocalScript()', async () => {
    await loadLocalScript(SOURCE_SCRIPT)
  })
  it('loadScript()', withTestServer(async (baseUrl) => {
    await loadScript(SOURCE_SCRIPT)
    await loadScript(`${baseUrl}/test-script`)
  }))

  it('loadLocalJSON()', async () => {
    await loadLocalJSON(SOURCE_JSON)
  })
  it('loadRemoteJSON()', withTestServer(async (baseUrl) => {
    await loadRemoteJSON(`${baseUrl}/test-json`)
  }))
  it('loadJSON()', withTestServer(async (baseUrl) => {
    await loadJSON(SOURCE_JSON)
    await loadJSON(`${baseUrl}/test-json`)
  }))
})
