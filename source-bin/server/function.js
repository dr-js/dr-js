import { getNetworkIPv4AddressList } from 'dr-js/module/node/system/NetworkAddress'
import { createServer, createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, createResponderParseURL, createResponderLog, createResponderLogEnd } from 'dr-js/module/node/server/Responder/Common'
import { createResponderFavicon } from 'dr-js/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'

const getServerInfo = (title, protocol, hostname, port, extra = []) => `[${title}]\n  ${[
  ...extra,
  'running at:',
  `  - '${protocol}//${hostname}:${port}'`,
  ...(hostname === '0.0.0.0' ? [
    'connect at:',
    ...getNetworkIPv4AddressList().map(({ address }) => `  - '${protocol}//${address}:${port}'`)
  ] : [])
].join('\n  ')}`

const commonCreateServer = ({ protocol, hostname, port, routeConfigList, isAddFavicon, log }) => {
  const { server, start, option } = createServer({ protocol, hostname, port })
  const responderLogEnd = createResponderLogEnd(log)
  server.on('request', createRequestListener({
    responderList: [
      createResponderParseURL(option),
      createResponderLog(log),
      createResponderRouter(createRouteMap(isAddFavicon
        ? [ ...routeConfigList, [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ] ]
        : routeConfigList
      ))
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
  return { server, start, option }
}

export {
  getServerInfo,
  commonCreateServer
}
