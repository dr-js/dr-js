import { isBasicObject } from 'source/common/check.js'
import { createTreeDepthFirstSearch } from 'source/common/data/Tree.js'
import {
  parseRouteToMap,
  findRouteFromMap,
  getRouteParamAny as getRouteMapParamAny,
  getRouteParam as getRouteMapParam
} from 'source/common/module/RouteMap.js'
import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME.js'
import { COMMON_LAYOUT, COMMON_STYLE } from 'source/common/module/HTML.js'

import { responderSendBufferCompress, prepareBufferData } from './Send.js'

const METHOD_MAP = {
  GET: '/GET',
  POST: '/POST',
  PUT: '/PUT',
  PATCH: '/PATCH',
  DELETE: '/DELETE',
  HEAD: '/HEAD',
  OPTIONS: '/OPTIONS',
  CONNECT: '/CONNECT',
  TRACE: '/TRACE'
}

// TODO: test 'routePrefix'
const appendRouteMap = (routeMap, routeInput = '/', method = 'GET', routeResponder, routePrefix = '') => {
  if (Array.isArray(routeInput)) return routeInput.reduce((o, v) => appendRouteMap(routeMap, v, method, routeResponder, routePrefix), routeMap)
  if (Array.isArray(method)) return method.reduce((o, v) => appendRouteMap(routeMap, routeInput, v, routeResponder, routePrefix), routeMap)
  const route = routePrefix ? `${routePrefix}${routeInput}` : routeInput
  const { routeNode, paramNameList } = parseRouteToMap(routeMap, route)
  const methodTag = METHOD_MAP[ method ]
  if (!methodTag) throw new Error(`invalid method [${method}] for: ${route}`)
  if (routeNode[ methodTag ]) throw new Error(`duplicate method [${method}] for: ${route}`)
  if (typeof (routeResponder) !== 'function') throw new Error(`invalid responder for: ${route}`)
  routeNode[ methodTag ] = { route, paramNameList, routeResponder }
  return routeMap
}

// TODO: test 'routePrefix'
const createRouteMap = (configList, routePrefix) => configList.reduce((o, [ route, method, routeResponder ]) => appendRouteMap(o, route, method, routeResponder, routePrefix), {})

const createResponderRouter = ({
  routeMap,
  serverExot,
  baseUrl = serverExot ? serverExot.option.baseUrl : '',
  getMethodUrl = createGetMethodUrl(new URL(baseUrl))
}) => (store) => {
  const { method, url } = getMethodUrl(store)
  const methodTag = METHOD_MAP[ method ]
  if (methodTag === undefined) return // throw new Error(`invalid method [${method}] from: ${url.href}`)

  const routeData = findRouteFromMap(routeMap, url.pathname)
  if (routeData === undefined) return // throw new Error(`no method [${method}] for: ${url.pathname}`)

  const { routeNode, paramValueList } = routeData
  if (routeNode[ methodTag ] === undefined) return // throw new Error(`no method [${method}] for: ${url.pathname}`)

  const { route, paramNameList, routeResponder } = routeNode[ methodTag ]
  const paramMap = paramNameList.reduce((o, paramName, index) => {
    o[ paramName ] = paramValueList[ index ]
    return o
  }, {})

  return routeResponder(store, store.setState({ method, url, route, paramMap }))
}
const createGetMethodUrl = (baseUrl) => ({ request: { method, url } }) => ({ method, url: new URL(url.replace(REGEXP_URL_REPLACE, '/'), baseUrl) })
const REGEXP_URL_REPLACE = /\/\//g // NOTE: check for `new URL('//a/list/', new URL('http://0.0.0.0/'))`

const getRouteParamAny = (store) => getRouteMapParamAny(store.getState())
const getRouteParam = (store, paramName) => getRouteMapParam(store.getState(), paramName)

const describeRouteMap = (routeMap) => {
  const routeInfoList = [ /* { method, route } */ ]
  const methodValueSet = new Set(Object.values(METHOD_MAP))
  routeMapDepthFirstSearch(
    [ 'ROOT', routeMap ],
    ([ key, { route } ]) => { methodValueSet.has(key) && routeInfoList.push({ method: key, route }) }
  )
  return routeInfoList
}
const routeMapDepthFirstSearch = createTreeDepthFirstSearch(
  ([ key, routeNode ]) => isBasicObject(routeNode) && Object.entries(routeNode)
)

// const SAMPLE_ROUTE_RESPONDER = (store, { url, route, method, paramMap }) => {}
// const SAMPLE_RESULT_ROUTE_MAP = {
//   '': {
//     // GET /users/list
//     // GET /users/
//     // GET /users
//     users: {
//       list: { '/GET': DEFAULT_ROUTE_PROCESSOR },
//       '': { '/GET': DEFAULT_ROUTE_PROCESSOR },
//       '/GET': DEFAULT_ROUTE_PROCESSOR
//     },
//     // GET '/'
//     '': { '/GET': DEFAULT_ROUTE_PROCESSOR },
//     // GET '/static/*'
//     static: { '/*': { '/GET': DEFAULT_ROUTE_PROCESSOR } },
//     // DELETE '/user/:userId'
//     user: { '/:PARAM': { '/DELETE': DEFAULT_ROUTE_PROCESSOR } }
//   }
// }

const createResponderRouteListHTML = ({
  getRouteMap, // () => routeMap
  extraBodyList
}) => {
  let bufferData
  return async (store) => {
    if (bufferData === undefined) bufferData = await prepareBufferData(Buffer.from(getRouteListHTML(getRouteMap(), extraBodyList)), BASIC_EXTENSION_MAP.html)
    return responderSendBufferCompress(store, bufferData)
  }
}

const getRouteListHTML = (routeMap, extraBodyList = []) => COMMON_LAYOUT([
  COMMON_STYLE(),
  '<style>body { align-items: start; }</style>'
], [
  '<h2>Route List</h2>',
  '<table>',
  ...describeRouteMap(routeMap)
    .map(({ method, route }) => `<tr><td><b>${method}</b></td><td>${method === '/GET' ? `<a href="${route}">${route}</a>` : route}</td></tr>`),
  '</table>',
  ...extraBodyList
])

export {
  METHOD_MAP,
  createRouteMap,
  createResponderRouter,
  appendRouteMap,
  getRouteParamAny,
  getRouteParam,
  describeRouteMap,
  createResponderRouteListHTML
}
