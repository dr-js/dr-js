import nodeModuleUrl from 'url'
// import nodeModuleStream from 'stream'

const responseReducerEnd = (store) => {
  if (store.response.finished) return store
  !store.response.headersSent && store.response.writeHead(store.getState().error ? 500 : 400)
  if (__DEV__) {
    const { error } = store.getState()
    error && store.response.write(`[ERROR] ${store.request.method}: ${store.request.url}\n${error.message}\n${error.stack}`)
    error && console.error(`[ERROR] ${store.request.method}: ${store.request.url}\n`, error)
  }
  store.response.end() // force end the response to prevent pending
  return store
}

const responseReducerLogState = (store) => {
  console.log(store.getState())
  return store
}

const createResponseReducerSendStream = (getStream) => (store) => Promise.resolve(getStream(store))
  .then(({ stream, length, type }) => new Promise((resolve, reject) => {
    store.response.writeHead(200, { 'content-type': type, 'content-length': length })
    stream.on('error', reject)
    stream.on('end', () => {
      store.response.removeListener('error', reject)
      resolve(store)
    })
    stream.pipe(store.response)
  }))

const createResponseReducerSendBuffer = (getBuffer) => (store) => Promise.resolve(getBuffer(store))
  .then(({ buffer, length, type }) => new Promise((resolve, reject) => {
    store.response.writeHead(200, { 'content-type': type, 'content-length': length })
    // const bufferStream = new nodeModuleStream.PassThrough()
    // bufferStream.on('error', reject)
    // bufferStream.on('end', () => resolve(store))
    // bufferStream.end(buffer)
    // bufferStream.pipe(store.response)
    store.response.on('error', reject)
    store.response.write(buffer, () => {
      store.response.removeListener('error', reject)
      resolve(store)
    })
  }))

const createResponseReducerReceiveBuffer = (setBuffer) => (store) => new Promise((resolve, reject) => {
  const data = []
  store.request.on('error', reject)
  store.request.on('data', (chunk) => data.push(chunk))
  store.request.on('end', () => {
    store.response.removeListener('error', reject)
    setBuffer(store, Buffer.concat(data))
    resolve(store)
  })
})

const createResponseReducerParseURL = (parseQueryString = true) => (store) => {
  const { url, method } = store.request
  store.setState({ url: nodeModuleUrl.parse(url, parseQueryString), method })
  return store
}

export {
  responseReducerEnd,
  responseReducerLogState,
  createResponseReducerParseURL,
  createResponseReducerSendStream,
  createResponseReducerSendBuffer,
  createResponseReducerReceiveBuffer
}
