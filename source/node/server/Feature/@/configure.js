import { createSecureContext } from 'tls'
import { objectMap } from 'source/common/immutable/Object.js'
import { createExotGroup } from 'source/common/module/Exot.js'

import { readBufferSync } from 'source/node/fs/File.js'
import { configureLog } from 'source/node/module/Log.js'
import { configurePid } from 'source/node/module/Pid.js'
import { addExitListenerLossyOnce } from 'source/node/system/ExitListener.js'

import { responderEnd, responderEndWithStatusCode, responderEndWithRedirect, createResponderLog, createResponderLogEnd } from 'source/node/server/Responder/Common.js'
import { createResponderRouter, createRouteMap, createResponderRouteListHTML } from 'source/node/server/Responder/Router.js'
import { createResponderFavicon } from 'source/node/server/Responder/Send.js'
import { createServerExot, createRequestListener, describeServerOption } from 'source/node/server/Server.js'
import { enableWSServer, createUpgradeRequestListener } from 'source/node/server/WS/Server.js'

__DEV__ && console.log('SAMPLE_TLS_SNI_CONFIG: single', { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined })
__DEV__ && console.log('SAMPLE_TLS_SNI_CONFIG: multi', {
  'default': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined }, // default hostname
  '0.domain.domain': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined }, // buffer or load from file
  '1.domain.domain': { key: Buffer || String, cert: Buffer || String, ca: Buffer || String || undefined } // buffer or load from file
})

const configureServerExot = ({
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
    key: autoLoadBuffer(key),
    cert: autoLoadBuffer(cert),
    ca: ca && autoLoadBuffer(ca),
    dhparam
  }))
  const secureContextMap = objectMap(optionMap, (option) => createSecureContext(option)) // pre-create and later reuse secureContext
  return {
    ...optionMap.default, // TODO: NOTE: currently can not pass pre-created secureContext directly
    SNICallback: Object.keys(optionMap).length >= 2 ? (hostname, callback) => callback(null, secureContextMap[ hostname ] || secureContextMap.default) : undefined
  }
}
const autoLoadBuffer = (bufferOrPath) => Buffer.isBuffer(bufferOrPath) ? bufferOrPath : readBufferSync(bufferOrPath)

const configureFeature = ({
  serverExot, loggerExot,
  routePrefix = '', // TODO: DEPRECATE: since all feature already accept `routePrefix`, this is just misleading // NOTE: this is "global" routePrefix, and will apply on feature routePrefix, so normally just use one
  isRawServer = false, // set to skip route related configure
  isFavicon = true, isDebugRoute = false, rootRouteResponder,
  preResponderList = [],
  preRouteList = [],
  responderLogEnd = createResponderLogEnd({ loggerExot })
}, featureList = []) => {
  serverExot.featureMap = new Map() // fill serverExot.featureMap
  serverExot.wsSet = undefined // may fill serverExot.wsSet

  let featureUrl
  const featureRouteList = []
  const featureWSRouteList = []
  featureList.forEach((feature) => {
    if (!feature) return
    if (!feature.name) throw new Error(`expect feature.name of ${feature}`)
    if (serverExot.featureMap.has(feature.name)) throw new Error(`duplicate feature.name: ${feature.name}`)
    serverExot.featureMap.set(feature.name, feature)
    if (!featureUrl) featureUrl = feature.URL_HTML // NOTE: use the first URL
    if (feature.routeList) featureRouteList.push(...feature.routeList)
    if (feature.wsRouteList) featureWSRouteList.push(...feature.wsRouteList)
  })

  if (isRawServer) {
    if ( // prevent dropping routes
      routePrefix ||
      preRouteList.length ||
      featureRouteList.length ||
      featureWSRouteList.length
    ) throw new Error('route setting conflict with isRawServer')
    return
  }

  const routeMap = createRouteMap([
    ...preRouteList,
    ...featureRouteList,
    !routePrefix && isFavicon && [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ],
    [ [ '/', '' ], 'GET', rootRouteResponder || (isDebugRoute ? createResponderRouteListHTML({ getRouteMap: () => routeMap })
      : featureUrl ? (store) => responderEndWithRedirect(store, { redirectUrl: `${routePrefix}${featureUrl}` })
        : (store) => responderEndWithStatusCode(store, { statusCode: 400 }))
    ]
  ].filter(Boolean), routePrefix)

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
    const routeMap = createRouteMap([
      ...featureWSRouteList
    ].filter(Boolean), routePrefix)
    serverExot.wsSet = enableWSServer(serverExot.server, {
      onUpgradeRequest: createUpgradeRequestListener({
        responderList: [
          createResponderLog({ loggerExot }),
          createResponderRouter({ routeMap, serverExot })
        ]
      })
    })
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

const runServerExotGroup = async (pack) => {
  const {
    serverExot,
    serverExotGroup = serverExot, // NOTE: also allow run serverExot
    loggerExot, isMuteLog = !loggerExot || false // optional
  } = pack
  addExitListenerLossyOnce((eventPack) => {
    isMuteLog || loggerExot.add(`[SERVER] down... ${JSON.stringify(eventPack)}${eventPack.error ? ` ${eventPack.error.stack || eventPack.error}` : ''}`)
    return serverExotGroup.down()
      .then(() => isMuteLog || loggerExot.add('[SERVER] down'))
  }) // trigger all exot down, the worst case those sync ones may still finish
  isMuteLog || loggerExot.add('[SERVER] up...')
  await serverExotGroup.up()
  isMuteLog || loggerExot.add('[SERVER] up')
  return pack // pass down pack
}

const runServer = async (
  configureServer, // async () => {} // custom configure
  serverOption, // pid, log, host/port ...
  featureOption, // feature only
  serverInfoTitle = !featureOption.packageName ? undefined : `${featureOption.packageName}@${featureOption.packageVersion}`
) => {
  configurePid(serverOption)
  const { loggerExot } = configureLog(serverOption)
  const serverExot = configureServerExot(serverOption)
  const serverInfo = describeServerOption(serverExot.option, serverInfoTitle, featureOption)

  await configureServer({ serverExot, loggerExot, serverInfo, ...featureOption }) // do custom config here

  loggerExot.add(serverInfo)
  return runServerExotGroup({
    serverOption, featureOption, loggerExot, // just pass to outer code
    serverExot, serverExotGroup: setupServerExotGroup(serverExot, loggerExot)
  })
}

export {
  configureServerExot,
  configureFeature,
  setupServerExotGroup, runServerExotGroup,
  runServer
}
