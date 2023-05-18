import { createSecureContext } from 'node:tls'
import { objectMap } from 'source/common/immutable/Object.js'
import { createExotGroup } from 'source/common/module/Exot.js'

import { readBufferSync } from 'source/node/fs/File.js'
import { configureLog } from 'source/node/module/Log.js'
import { configurePid } from 'source/node/module/Pid.js'
import { addExitListenerLossyOnce } from 'source/node/system/ExitListener.js'

import { responderEnd, responderEndWithStatusCode, responderEndWithRedirect, createResponderLog, createResponderLogEnd } from 'source/node/server/Responder/Common.js'
import { createResponderRouter, createRouteMap, describeRouteMap, createResponderRouteListHTML } from 'source/node/server/Responder/Router.js'
import { createResponderFavicon } from 'source/node/server/Responder/Send.js'
import { createServerExot, createRequestListener, describeServerOption } from 'source/node/server/Server.js'
import { enableWSServer, createUpgradeRequestListener } from 'source/node/server/WS/Server.js'

__DEV__ && console.log('SAMPLE_TLS_SNI_CONFIG: single', { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined })
__DEV__ && console.log('SAMPLE_TLS_SNI_CONFIG: multi', {
  'default': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined }, // default hostname
  '0.domain.domain': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined }, // buffer or load from file
  '1.domain.domain': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined } // buffer or load from file
})

/** @deprecated */ const configureServerExot = ({
  protocol = 'http:', hostname = '127.0.0.1', port,
  TLSSNIConfig, TLSDHParam, // accept Buffer or String (absolute path)
  ...extraOption
}) => createServerExot({
  protocol, hostname, port,
  ...(protocol === 'https:' && loadTLS(TLSSNIConfig, TLSDHParam)),
  ...extraOption
})

// for server support multi HTTPS hostname, check `SNICallback`:
//   https://nodejs.org/dist/latest/docs/api/tls.html#tls_tls_connect_options_callback
//   https://en.wikipedia.org/wiki/Server_Name_Indication
//   https://github.com/nodejs/node/issues/17567
const loadTLS = (
  TLSSNIConfig,
  TLSDHParam // Diffie-Hellman Key Exchange, generate with `openssl dhparam -dsaparam -outform PEM -out output/path/dh4096.pem 4096`
) => {
  if (TLSSNIConfig.key) TLSSNIConfig = { default: TLSSNIConfig } // convert single config to multi config
  if (!TLSSNIConfig.default) TLSSNIConfig.default = Object.values(TLSSNIConfig)[ 0 ] // use the first as default, if not set
  if (!TLSSNIConfig.default) throw new Error('no default TLS config')
  const dhparam = TLSDHParam && autoLoadBuffer(TLSDHParam)
  const optionMap = objectMap(TLSSNIConfig, ({ key, cert, ca }) => ({
    // for Let'sEncrypt/CertBot cert config check: https://community.letsencrypt.org/t/node-js-configuration/5175
    key: autoLoadBuffer(key), // Let'sEncrypt/CertBot cert: privkey.pem
    cert: autoLoadBuffer(cert), // Let'sEncrypt/CertBot cert: fullchain.pem
    ca: ca && autoLoadBuffer(ca), // Let'sEncrypt/CertBot cert: chain.pem
    dhparam
  }))
  const secureContextMap = objectMap(optionMap, (option) => createSecureContext(option)) // pre-create and later reuse secureContext
  return {
    ...optionMap.default, // TODO: NOTE: currently can not pass pre-created secureContext directly
    SNICallback: Object.keys(optionMap).length >= 2 ? (hostname, callback) => callback(null, secureContextMap[ hostname ] || secureContextMap.default) : undefined
  }
}
const autoLoadBuffer = (bufferOrPath) => Buffer.isBuffer(bufferOrPath) ? bufferOrPath : readBufferSync(bufferOrPath)

const setupServer = ({
  protocol = 'http:', hostname = '127.0.0.1', port,
  TLSSNIConfig, TLSDHParam, // accept Buffer or String (absolute path)
  ...extraOption // pid, log
}) => {
  configurePid(extraOption)
  const { loggerExot } = configureLog(extraOption)
  const serverExot = createServerExot({
    protocol, hostname, port,
    ...(protocol === 'https:' && loadTLS(TLSSNIConfig, TLSDHParam)),
    ...extraOption
  })
  return { loggerExot, serverExot }
}

/** @deprecated */ const configureFeature = (option, featureList = []) => setupFeature(featureList, option)
__DEV__ && console.log('SAMPLE: featureList', [ { name: 'feat:name', routeList: [], wsRouteList: [] } ])
const setupFeature = (featureList = [], {
  serverExot, loggerExot,
  isRawServer = false, // set to skip route related configure
  isFavicon = true, isDebugRoute = false, rootRouteResponder,
  preResponderList = [],
  preRouteList = [],
  responderLogEnd = createResponderLogEnd({ loggerExot })
}) => {
  serverExot.featureMap = new Map() // fill serverExot.featureMap
  serverExot.wsSet = undefined // may fill serverExot.wsSet
  preRouteList = preRouteList.filter(Boolean)

  let featureUrl
  const featureRouteList = []
  const featureWSRouteList = []
  featureList.forEach((feature) => {
    if (!feature) return
    if (!feature.name) throw new Error(`expect feature.name of ${feature}`)
    if (serverExot.featureMap.has(feature.name)) throw new Error(`duplicate feature.name: ${feature.name}`)
    serverExot.featureMap.set(feature.name, feature)
    if (!featureUrl) featureUrl = feature.URL_HTML // NOTE: use the first URL
    if (feature.routeList) featureRouteList.push(...feature.routeList.filter(Boolean))
    if (feature.wsRouteList) featureWSRouteList.push(...feature.wsRouteList.filter(Boolean))
  })

  if (isRawServer) {
    if ( // prevent dropping routes
      preRouteList.length ||
      featureRouteList.length ||
      featureWSRouteList.length
    ) throw new Error('route setting conflict with isRawServer')
    return
  }

  const routeMap = createRouteMap([
    ...preRouteList,
    ...featureRouteList,
    isFavicon && [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ],
    [ [ '/', '' ], 'GET', rootRouteResponder || (isDebugRoute ? createResponderRouteListHTML({ getRouteMap: () => routeMap })
      : featureUrl ? (store) => responderEndWithRedirect(store, { redirectUrl: featureUrl })
        : (store) => responderEndWithStatusCode(store, { statusCode: 400 }))
    ]
  ].filter(Boolean))

  serverExot.server.on('request', createRequestListener({
    responderList: [
      ...preResponderList,
      createResponderLog({ loggerExot }),
      createResponderRouter({ routeMap, serverExot })
    ].filter(Boolean),
    responderEnd: (store) => {
      responderEnd(store)
      return responderLogEnd(store) // return to allow this to be async
    }
  }))

  if (featureWSRouteList.length !== 0) { // setup WS
    const routeMap = createRouteMap(featureWSRouteList)
    serverExot.wsSet = enableWSServer(serverExot.server, {
      onUpgradeRequest: createUpgradeRequestListener({
        responderList: [
          createResponderLog({ loggerExot }),
          createResponderRouter({ routeMap, serverExot })
        ]
      })
    })
  }
  return { // for route listing
    RouteList: describeRouteMap(routeMap),
    RouteListWS: featureWSRouteList.length === 0 ? [] : describeRouteMap(createRouteMap(featureWSRouteList))
  }
}

const setupServerExotGroup = ( // NOTE: this allow put 2 serverExot with shared loggerExot in same serverExotGroup
  serverExot,
  loggerExot,
  serverExotGroup = createExotGroup({
    id: 'exot:group-server',
    getOnExotError: (serverExotGroup) => (error) => {
      console.log('[exot-group-error]', error)
      return serverExotGroup.down()
    }
  })
) => {
  loggerExot && serverExotGroup.set(loggerExot) // first up, last down
  if (serverExot.featureMap) {
    for (const { exotList } of serverExot.featureMap.values()) { // NOTE: this order will up all featureExot before serverExot
      if (exotList && exotList.length) for (const exot of exotList) serverExotGroup.set(exot)
    }
  }
  serverExotGroup.set(serverExot) // last up, first down
  return serverExotGroup
}

const startServerExotGroup = async ({
  loggerExot, serverExot,
  serverExotGroup = loggerExot ? setupServerExotGroup(serverExot, loggerExot) : serverExot, // NOTE: also allow run serverExot
  isMuteLog = !loggerExot || false // optional
}) => {
  addExitListenerLossyOnce((eventPack) => {
    isMuteLog || loggerExot.add(`[SERVER] down... ${JSON.stringify(eventPack)}${eventPack.error ? ` ${eventPack.error.stack || eventPack.error}` : ''}`)
    return serverExotGroup.down()
      .then(() => isMuteLog || loggerExot.add('[SERVER] down'))
  }) // trigger all exot down, the worst case those sync ones may still finish
  isMuteLog || loggerExot.add('[SERVER] up...')
  await serverExotGroup.up()
  isMuteLog || loggerExot.add('[SERVER] up')
}

/** @deprecated */ const runServerExotGroup = async (pack) => {
  await startServerExotGroup(pack)
  return pack // pass down pack
}

/** @deprecated */ const runServer = async (
  configureServer, // async () => {} // custom configure
  serverOption, // pid, log, host/port ...
  featureOption, // feature only
  serverInfoTitle = !featureOption.packageName ? undefined : `${featureOption.packageName}@${featureOption.packageVersion}`
) => {
  const { loggerExot, serverExot } = setupServer(serverOption)
  const serverInfo = describeServerOption(serverExot.option, serverInfoTitle, featureOption)

  await configureServer({ serverExot, loggerExot, serverInfo, ...featureOption }) // do custom config here

  loggerExot.add(serverInfo)
  return runServerExotGroup({
    serverOption, featureOption, loggerExot, // just pass to outer code
    serverExot, serverExotGroup: setupServerExotGroup(serverExot, loggerExot)
  })
}

export {
  setupServer,
  setupFeature,
  setupServerExotGroup, startServerExotGroup,

  configureServerExot,
  configureFeature,
  runServerExotGroup,
  runServer
}
