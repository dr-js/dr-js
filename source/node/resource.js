import nodeModuleFs from 'fs'
import nodeModuleVm from 'vm'
import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'
import { URL } from 'url'
import { promisify } from 'util'

import { getLocalPath } from 'source/node/system'
import { clock, setTimeoutAsync } from 'source/common/time'

const readFileAsync = promisify(nodeModuleFs.readFile)

const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond

// TODO: native fetch do not have a timeout, yet?
// TODO: currently should call end to drop connection
const fetch = async (url, config = {}) => {
  const { method, headers, body = null, timeout = DEFAULT_TIMEOUT } = config
  const option = { ...urlToOption(new URL(url)), method, headers, timeout } // will result in error if timeout
  const response = await requestAsync(option, body)
  const status = response.statusCode
  const ok = (status >= 200 && status < 300)
  const buffer = () => receiveBufferAsync(response)
  const text = () => buffer().then((buffer) => buffer.toString())
  const json = () => text().then((text) => JSON.parse(text))
  const end = () => response.destroy()
  return { status, ok, buffer, text, json, end }
}

const urlToOption = ({ protocol, hostname, hash, search, pathname, href, port, username, password }) => {
  const option = { protocol, hostname, href, hash, search, pathname, path: `${pathname}${search}` }
  if (port !== '') option.port = Number(port)
  if (username || password) option.auth = `${username}:${password}`
  return option
}
const requestAsync = (option, body) => new Promise((resolve, reject) => {
  const request = (option.protocol === 'https:' ? nodeModuleHttps : nodeModuleHttp).request(option, resolve)
  request.on('timeout', reject)
  request.on('error', reject)
  body && request.write(body)
  request.end()
})
const receiveBufferAsync = (response) => new Promise((resolve, reject) => {
  const data = []
  response.on('error', reject)
  response.on('data', (chunk) => data.push(chunk))
  response.on('end', () => {
    response.removeListener('error', reject)
    resolve(Buffer.concat(data))
  })
})

// ping with a status code of 500 is still a successful ping
const pingRequestAsync = async ({ url, body, method, headers, timeout = 5000, retryCount = 0 }) => {
  const option = { ...urlToOption(new URL(url)), method, headers, timeout } // will result in error if timeout
  while (retryCount >= 0) {
    const startTime = clock()
    try {
      __DEV__ && console.log('[pingRequestAsync] start:', url)
      const response = await requestAsync(option, body)
      __DEV__ && console.log('[pingRequestAsync] success:', url, response.statusCode)
      response.destroy() // skip response data
      break
    } catch (error) {
      __DEV__ && console.warn('[pingRequestAsync] error:', retryCount, error)
      if (retryCount === 0) throw error
      const remainingTime = timeout - (clock() - startTime)
      if (remainingTime > 0) await setTimeoutAsync(remainingTime)
    }
    retryCount--
  }
}

const loadScript = (src) => src.includes('://') ? loadRemoteScript(src) : loadLocalScript(src)
const loadJSON = (src) => src.includes('://') ? loadRemoteJSON(src) : loadLocalJSON(src)
const loadRemoteScript = async (src) => {
  const response = await fetch(src)
  return nodeModuleVm.runInThisContext(await response.text(), { filename: src })
}
const loadRemoteJSON = async (src) => {
  const response = await fetch(src)
  return parseJSON(await response.text())
}
const loadLocalScript = async (src) => {
  const filePath = getLocalPath(src)
  return nodeModuleVm.runInThisContext(await readFileAsync(filePath, { encoding: 'utf8' }), { filename: filePath })
}
const loadLocalJSON = async (src) => {
  const filePath = getLocalPath(src)
  return parseJSON(await readFileAsync(filePath, { encoding: 'utf8' }))
}

const parseJSON = (fileString) => {
  const stringList = fileString.split('\n').forEach((v) => v.replace(/\/\/.*/, '')) // support single line comment like '// ...'
  return JSON.parse(stringList.join('\n'))
}

export {
  fetch,
  urlToOption,
  requestAsync,
  receiveBufferAsync,

  pingRequestAsync,

  loadScript,
  loadJSON,
  loadRemoteScript,
  loadRemoteJSON,
  loadLocalScript,
  loadLocalJSON
}
