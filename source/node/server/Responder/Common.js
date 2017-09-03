import nodeModuleUrl from 'url'

const responderEnd = (store) => {
  if (store.response.finished) return store
  const { error } = store.getState()
  !store.response.headersSent && store.response.writeHead(error ? 500 : 400)
  __DEV__ && error && store.response.write(`[ERROR] ${store.request.method}: ${store.request.url}\n${error.message}\n${error.stack}`)
  __DEV__ && error && console.error(`[ERROR] ${store.request.method}: ${store.request.url}\n`, error)
  store.response.end() // force end the response to prevent pending
}

const responderLogState = (store) => console.log(store.getState())

const verifyEntityTag = (headers, entityTag) => {
  const matchTag = headers[ 'if-none-match' ]
  return Boolean(matchTag && matchTag.startsWith(entityTag))
}

const createResponderSendStream = (getStream) => async (store) => {
  const { stream, length, type, entityTag } = await getStream(store)
  const hasEntityTag = Boolean(entityTag)
  hasEntityTag && store.response.setHeader('etag', entityTag)
  if (hasEntityTag && verifyEntityTag(store.request.headers, entityTag)) return store.response.writeHead(304, { 'content-type': type })
  store.response.writeHead(200, { 'content-type': type, 'content-length': length })
  return length !== 0 && new Promise((resolve, reject) => {
    stream.on('error', reject)
    stream.on('end', () => {
      store.response.removeListener('error', reject)
      resolve()
    })
    stream.pipe(store.response)
  })
}

const createResponderSendBuffer = (getBuffer) => async (store) => {
  const { buffer, length, type, entityTag } = await getBuffer(store)
  const hasEntityTag = Boolean(entityTag)
  hasEntityTag && store.response.setHeader('etag', entityTag)
  if (hasEntityTag && verifyEntityTag(store.request.headers, entityTag)) return store.response.writeHead(304, { 'content-type': type })
  store.response.writeHead(200, { 'content-type': type, 'content-length': length })
  return length !== 0 && new Promise((resolve, reject) => {
    store.response.on('error', reject)
    store.response.write(buffer, () => {
      store.response.removeListener('error', reject)
      resolve()
    })
  })
}

const createResponderReceiveBuffer = (setBuffer) => (store) => new Promise((resolve, reject) => {
  const data = []
  store.request.on('error', reject)
  store.request.on('data', (chunk) => data.push(chunk))
  store.request.on('end', () => {
    store.response.removeListener('error', reject)
    setBuffer(store, Buffer.concat(data))
    resolve()
  })
})

const createResponderParseURL = (parseQueryString = true) => (store) => {
  const { url, method } = store.request
  store.setState({ url: nodeModuleUrl.parse(url, parseQueryString), method })
}

export {
  responderEnd,
  responderLogState,
  createResponderParseURL,
  createResponderSendStream,
  createResponderSendBuffer,
  createResponderReceiveBuffer
}
