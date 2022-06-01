import { createInsideOutPromise, withTimeoutPromise } from 'source/common/function.js'
import { clock } from 'source/common/time.js'
import { requestHttp } from 'source/node/net.js'
import { run } from 'source/node/run.js'

// TODO: currently `ping` is actually `tcp-ping`,

// HACK NOTE
//   Pending DNS resolve may block node exit on win32 for up to 10sec for the use of `dns.lookup()`,
//     but the `dns.resolve*()` will not use custom defined system HOSTS file.
//   This hack use another node process to get system dns,
//     it's much heavier, but as a separate process it's stoppable and quite fast.
//   check: https://nodejs.org/api/dns.html#dns_implementation_considerations
//   check: https://github.com/nodejs/node/blob/v14.13.1/lib/net.js#L1038-L1040
const getHackLookupDNS = (subProcessSet) => (hostname, option, callback) => {
  __DEV__ && console.log('[getHackLookupDNS]', { hostname, option, callback })
  const { subProcess, promise, stdoutPromise } = run([
    process.execPath, '-e', `require('node:dns').lookup(${JSON.stringify(hostname)}, ${JSON.stringify(option)}, (error, ...args) => console.log(JSON.stringify([ error ? error.stack : null, ...args ])))`
  ], { quiet: true })
  promise
    .then(async () => {
      const [ errorStack, ...args ] = JSON.parse(String(await stdoutPromise))
      __DEV__ && console.log('[getHackLookupDNS]', { hostname, errorStack, args })
      callback(errorStack ? new Error(errorStack) : undefined, ...args)
    })
    .catch((error) => {
      __DEV__ && console.log('[getHackLookupDNS]', { hostname, error })
      callback(error)
    })
    .then(() => subProcessSet.delete(subProcess))
  subProcessSet.add(subProcess)
}

const DEFAULT_PING_TIMEOUT = 5 * 1000

const batchRequestUrlList = (onResponse, urlList, option, body) => {
  const requestSet = new Set()
  const subProcessSet = new Set()
  if (option.lookup === undefined) option.lookup = getHackLookupDNS(subProcessSet)
  const promise = Promise.all(urlList.map((url) => {
    const { request, promise } = requestHttp(url, option, body)
    requestSet.add(request)
    return promise.then((response) => {
      requestSet.delete(request)
      response.destroy() // skip response data
      __DEV__ && console.log('[batchRequestUrlList] hit', url)
      onResponse(url)
    }, (error) => { // skip error
      requestSet.delete(request)
      __DEV__ && console.log('[batchRequestUrlList] miss', url, String(error))
    })
  }))
  const clear = () => {
    __DEV__ && console.log('[batchRequestUrlList] clear', requestSet.size, subProcessSet.size)
    for (const request of requestSet) request.destroy()
    for (const subProcess of subProcessSet) subProcess.kill()
    return promise
  }
  return { requestSet, promise, clear }
}

const pingRaceUrlList = async (urlList = [], {
  timeout = DEFAULT_PING_TIMEOUT, // in msec, 0 for unlimited
  body = null,
  ...option
} = {}) => {
  if (urlList.length < 2) return urlList[ 0 ] // faster exit
  const { promise, resolve } = createInsideOutPromise()
  const batchRequest = batchRequestUrlList(resolve, urlList, { timeout, ...option }, body)
  const resultUrl = await withTimeoutPromise(promise, timeout).catch((error) => {
    __DEV__ && console.log('[pingStatUrlList] timeout:', String(error))
    return urlList[ 0 ] // default to first url
  })
  __DEV__ && console.log('[pingRaceUrlList] requestSet size:', batchRequest.requestSet.size)
  await batchRequest.clear()
  __DEV__ && console.log('[pingRaceUrlList] requestSet size:', batchRequest.requestSet.size)
  return resultUrl
}

// result in url-stat map
const PING_STAT_ERROR = null
const pingStatUrlList = async (urlList = [], {
  timeout = DEFAULT_PING_TIMEOUT, // in msec, 0 for unlimited
  body = null,
  ...option
} = {}) => {
  const statMap = urlList.reduce((o, url) => {
    o[ url ] = PING_STAT_ERROR // first set all url stat to PING_STAT_ERROR
    return o
  }, {}) // { url: msec/null }
  const timeStart = clock()
  const batchRequest = batchRequestUrlList((url) => {
    statMap[ url ] = clock() - timeStart
  }, urlList, { timeout, ...option }, body)
  await withTimeoutPromise(batchRequest.promise, timeout).catch((error) => { __DEV__ && console.log('[pingStatUrlList] timeout:', error) })
  __DEV__ && console.log('[pingStatUrlList] requestSet size:', batchRequest.requestSet.size)
  await batchRequest.clear()
  __DEV__ && console.log('[pingStatUrlList] requestSet size:', batchRequest.requestSet.size)
  return statMap
}

export {
  pingRaceUrlList,
  pingStatUrlList, PING_STAT_ERROR
}
