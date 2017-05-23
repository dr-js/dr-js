import nodeModuleUrl from 'url'

const responseReducerLogState = (store) => {
  __DEV__ && console.log(store.getState())
  return store
}

const responseReducerEnd = (store) => {
  if (store.response.finished) return store
  const { error } = store.getState()
  if (error) store.response.statusCode = 500
  __DEV__ && error && console.log(`[ERROR] ${store.request.method}: ${store.request.url}\n`, error)
  __DEV__ && error && store.response.write(`[ERROR] ${store.request.method}: ${store.request.url}\n${error.message}\n${error.stack}`)
  store.response.end() // force end the response to prevent pending
  return store
}

const createResponseReducerParseURL = (parseQueryString = true) => (store) => {
  store.setState({ url: nodeModuleUrl.parse(store.request.url, parseQueryString) })
  return store
}

const createResponseReducerReceiveBuffer = () => (store) => new Promise((resolve, reject) => {
  const data = []
  store.request.addListener('error', reject)
  store.request.addListener('data', (chunk) => data.push(chunk))
  store.request.addListener('end', () => {
    store.setState({ buffer: Buffer.concat(data) })
    resolve(store)
  })
})

export {
  responseReducerLogState,
  responseReducerEnd,
  createResponseReducerParseURL,
  createResponseReducerReceiveBuffer
}
