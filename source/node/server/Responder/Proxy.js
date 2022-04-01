import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { requestHttp } from 'source/node/net.js'

const createResponderHTTPRequestProxy = ({
  getProxyConfig, // async (store) => ({ proxyUrl, method, headers })
  timeout = 42 * 1000
}) => async (store) => {
  const { proxyUrl, method, headers } = await getProxyConfig(store)
  __DEV__ && console.log('[ResponderHTTPRequestProxy]', { proxyUrl, method, headers })
  const response = await requestHttp(proxyUrl, { method, headers, timeout }, store.request).promise // use request stream as body
  store.response.writeHead(response.statusCode, response.headers) // send back status & header
  return quickRunletFromStream(response, store.response) // send back payload
}

export { createResponderHTTPRequestProxy }
