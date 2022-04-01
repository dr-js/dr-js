import { time } from 'source/common/format.js'
import { METHOD_MAP } from 'source/node/server/Responder/Router.js'
import { createResponderHTTPRequestProxy } from 'source/node/server/Responder/Proxy.js'

const configure = ({
  targetOrigin,
  isSetXForward = false,
  timeout, // in msec
  log
}) => {
  const responderHTTPRequestProxy = createResponderHTTPRequestProxy({
    timeout,
    getProxyConfig: (store) => {
      const { request: { url, method, headers, socket: { remoteAddress } } } = store // the url is the "path" part without host, check: https://nodejs.org/api/http.html#http_message_url
      const { href: proxyUrl, host } = new URL(url, targetOrigin)
      log(`[PROXY] ${proxyUrl}`)
      return {
        proxyUrl, method,
        headers: {
          ...headers, host, // always change host
          ...(isSetXForward && { // add `X-Forward-*` like nginx
            'x-real-ip': remoteAddress,
            'x-forwarded-for': remoteAddress,
            'x-forwarded-host': headers.host || '',
            'x-forwarded-proto': 'http' // code here is http-only
          })
        }
      }
    }
  })

  const routeConfigList = [
    [ [ '/', '/*' ], Object.keys(METHOD_MAP), responderHTTPRequestProxy ]
  ]

  return {
    routeConfigList,
    isAddFavicon: false,
    title: 'ServerHttpRequestProxy',
    extraInfo: { targetOrigin, isSetXForward, timeout: time(timeout) }
  }
}

export { configure }
