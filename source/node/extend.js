import Dr from 'Dr'

import nodeModuleVm from 'vm'
import nodeModuleFs from 'fs'
import nodeModuleUrl from 'url'
import nodeModuleHttp from 'http'
import nodeModuleHttps from 'https'

export function loadScriptSync (src) {
  const filePath = Dr.getLocalPath(src)
  try {
    const data = nodeModuleFs.readFileSync(filePath)
    nodeModuleVm.runInThisContext(data.toString(), { filename: filePath })
  } catch (error) {
    Dr.logError(error, '[loadScript] Failed to load Script', filePath)
  }
}

export function loadJSONSync (src) {
  const filePath = Dr.getLocalPath(src)
  const fileString = nodeModuleFs.readFileSync(filePath, { encoding: 'utf8' })
  const stringList = fileString.split('\n').forEach((v) => v.replace(/\/\/.*/, '')) // support single line comment like '//...'
  return JSON.parse(stringList.join('\n'))
}

export function createRequest ({ url, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const urlObject = nodeModuleUrl.parse(url)
    const options = {
      hostname: urlObject.hostname,
      port: urlObject.port || '',
      path: (urlObject.pathname || '') + (urlObject.search || '') + (urlObject.hash || ''),
      method,
      headers
    }

    const request = (urlObject.protocol === 'https:' ? nodeModuleHttps : nodeModuleHttp).request(options, (response) => {
      const data = []
      response.on('data', (chunk) => { data.push(chunk) })
      response.on('end', () => {
        const status = response.statusCode
        resolve({
          request,
          response,
          status,
          ok: (status >= 200 && status < 300),
          body: Buffer.concat(data)
        })
      })
      response.on('error', (error) => { reject(error) })
    })
    request.on('error', (error) => { reject(error) })
    body && request.write(body)
    request.end()
  })
}

export function fetch (url, config) {
  return createRequest({ url, ...config }) // super simple simulate
    .then((result) => {
      result.text = () => Promise.resolve(result.body.toString())
      result.json = () => Promise.resolve(JSON.parse(result.body.toString()))
      return result
    })
}
