import { resolve, dirname } from 'path'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { runInNewContext } from 'vm'
import { URL } from 'url'

import { clock, setTimeoutAsync } from 'source/common/time'
import { readFileAsync } from 'source/node/file/__utils__'

const DEFAULT_TIMEOUT = 10 * 1000 // in millisecond

// TODO: native fetch do not have timeout
// NOTE:
//   currently should call one of `buffer, text, json` to receive data.
//   These method can only be called once.
//   If not, on nextTick, the data will be dropped.
const DATA_STATE = {
  PENDING: 'PENDING',
  RECEIVING: 'RECEIVING',
  CLOSED: 'CLOSED'
}
const fetch = async (url, config = {}) => {
  const { method, headers, body = null, timeout = DEFAULT_TIMEOUT } = config
  const option = { ...urlToOption(new URL(url)), method, headers, timeout } // will result in error if timeout
  const response = await requestAsync(option, body)
  const status = response.statusCode
  const ok = (status >= 200 && status < 300)
  let responseDataState = DATA_STATE.PENDING
  let bufferCache
  process.nextTick(() => {
    if (responseDataState === DATA_STATE.RECEIVING) return
    responseDataState = DATA_STATE.CLOSED
    response.destroy() // drop response data
  })
  const buffer = async () => {
    if (bufferCache === undefined) {
      if (responseDataState !== DATA_STATE.PENDING) throw new Error('[fetch] data already dropped, should call receive data immediately')
      responseDataState = DATA_STATE.RECEIVING
      bufferCache = await receiveBufferAsync(response)
      responseDataState = DATA_STATE.CLOSED
    }
    return bufferCache
  }
  const text = () => buffer().then((buffer) => buffer.toString())
  const json = () => text().then((text) => JSON.parse(text))
  return { status, ok, buffer, text, json }
}

const urlToOption = ({ protocol, hostname, hash, search, pathname, href, port, username, password }) => {
  const option = { protocol, hostname, hash, search, pathname, href, path: `${pathname}${search}` }
  if (port !== '') option.port = Number(port)
  if (username || password) option.auth = `${username}:${password}`
  return option
}

const requestAsync = (option, body) => new Promise((resolve, reject) => {
  const request = (option.protocol === 'https:' ? httpsRequest : httpRequest)(option, resolve)
  const endWithError = (error) => {
    request.destroy()
    reject(error)
  }
  request.on('timeout', endWithError)
  request.on('error', endWithError)
  request.end(body)
})

const receiveBufferAsync = (readableStream) => new Promise((resolve, reject) => {
  const data = []
  readableStream.on('error', reject)
  readableStream.on('data', (chunk) => data.push(chunk))
  readableStream.on('end', () => {
    readableStream.removeListener('error', reject)
    resolve(Buffer.concat(data))
  })
})

const sendBufferAsync = (writableStream, buffer) => new Promise((resolve, reject) => {
  writableStream.on('error', reject)
  writableStream.write(buffer, () => {
    writableStream.removeListener('error', reject)
    resolve()
  })
})

const pipeStreamAsync = (writableStream, readableStream) => new Promise((resolve, reject) => {
  readableStream.on('error', reject)
  readableStream.on('end', () => {
    readableStream.removeListener('error', reject)
    resolve()
  })
  readableStream.pipe(writableStream)
})

// ping with a status code of 500 is still a successful ping
const pingRequestAsync = async ({ url, body, timeout = 5000, retryCount = 0, ...option }) => {
  option = { ...option, ...urlToOption(new URL(url)), timeout } // will result in error if timeout
  while (retryCount >= 0) {
    const startTime = clock()
    try {
      const response = await requestAsync(option, body)
      response.destroy() // skip response data
      break
    } catch (error) {
      if (retryCount === 0) throw error
      const remainingTime = timeout - (clock() - startTime)
      if (remainingTime > 0) await setTimeoutAsync(remainingTime)
    }
    retryCount--
  }
}

// TODO: check if is needed, or simplify
const loadScript = (src, contextObject) => src.includes('://') ? loadRemoteScript(src, contextObject) : loadLocalScript(src, contextObject)
const loadJSON = (src) => src.includes('://') ? loadRemoteJSON(src) : loadLocalJSON(src)
const loadRemoteScript = async (src, contextObject) => {
  const response = await fetch(src)
  return runInNewContext(await response.text(), contextObject, { filename: src })
}
const loadRemoteJSON = async (src) => {
  const response = await fetch(src)
  return response.json()
}
const loadLocalScript = async (src, contextObject) => {
  const filePath = getLocalPath(src)
  return runInNewContext(await readFileAsync(filePath, 'utf8'), contextObject, { filename: filePath })
}
const loadLocalJSON = async (src) => {
  const filePath = getLocalPath(src)
  return JSON.parse(await readFileAsync(filePath, 'utf8'))
}
const PATH_NODE_START_SCRIPT = resolve(process.cwd(), dirname(process.argv[ 1 ] || ''))
const getLocalPath = (relativePath) => resolve(PATH_NODE_START_SCRIPT, relativePath)

export {
  fetch,
  urlToOption,
  requestAsync,

  receiveBufferAsync,
  sendBufferAsync,
  pipeStreamAsync,

  pingRequestAsync,

  loadScript,
  loadJSON,
  loadRemoteScript,
  loadRemoteJSON,
  loadLocalScript,
  loadLocalJSON
}
