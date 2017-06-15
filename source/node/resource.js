import nodeModuleFs from 'fs'
import nodeModuleVm from 'vm'
import nodeModuleUrl from 'url'
import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'

import { getLocalPath } from 'source/node/system'

const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond

// TODO: native fetch do not have a timeout, yet?
const fetch = (url, config = {}) => new Promise((resolve, reject) => {
  const { method = 'GET', headers, body = null, timeout = DEFAULT_TIMEOUT } = config
  const urlObject = nodeModuleUrl.parse(url)
  const options = {
    hostname: urlObject.hostname,
    port: urlObject.port || '',
    path: (urlObject.pathname || '') + (urlObject.search || '') + (urlObject.hash || ''),
    method,
    headers,
    timeout // will result in error
  }

  const request = (urlObject.protocol === 'https:' ? nodeModuleHttps : nodeModuleHttp).request(options, (response) => {
    const data = []
    response.on('data', (chunk) => { data.push(chunk) })
    response.on('end', () => {
      const status = response.statusCode
      const responseBuffer = Buffer.concat(data)
      resolve({
        status,
        ok: (status >= 200 && status < 300),
        text: () => responseBuffer.toString(),
        json: () => JSON.parse(responseBuffer.toString())
      })
    })
    response.on('error', reject)
  })
  request.on('error', reject)
  body && request.write(body)
  request.end()
})

function loadScript (src) {
  if (src.search(':// ') !== -1) return loadRemoteScript(src)
  else return loadLocalScript(src)
}

function loadJSON (src) {
  if (src.search(':// ') !== -1) return loadRemoteJSON(src)
  else return loadLocalJSON(src)
}

const loadRemoteScript = (src) => {
  return fetch(src)
    .then((result) => result.text())
    .then((fileString) => {
      const stringList = fileString.split('\n').forEach((v) => v.replace(/\/\/.*/, '')) // support single line comment like '// ...'
      return JSON.parse(stringList.join('\n'))
    })
}

const loadRemoteJSON = (src) => {
  return fetch(src)
    .then((result) => result.text())
    .then((fileString) => nodeModuleVm.runInThisContext(fileString, { filename: src }))
}

const loadLocalScript = (src) => new Promise((resolve, reject) => {
  const filePath = getLocalPath(src)
  nodeModuleFs.readFile(filePath, { encoding: 'utf8' }, (error, fileString) => {
    if (error) return reject(error)
    nodeModuleVm.runInThisContext(fileString, { filename: filePath })
    resolve()
  })
})

const loadLocalJSON = (src) => new Promise((resolve, reject) => {
  const filePath = getLocalPath(src)
  nodeModuleFs.readFile(filePath, { encoding: 'utf8' }, (error, fileString) => {
    if (error) return reject(error)
    const stringList = fileString.split('\n').forEach((v) => v.replace(/\/\/.*/, '')) // support single line comment like '// ...'
    resolve(JSON.parse(stringList.join('\n')))
  })
})

export {
  fetch,

  loadScript,
  loadJSON,
  loadRemoteScript,
  loadRemoteJSON,
  loadLocalScript,
  loadLocalJSON
}
