import { objectDepthFirstSearch } from 'source/common/immutable/Object'
import {
  parseRouteToMap,
  findRouteFromMap,
  getRouteParamAny as getRouteMapParamAny,
  getRouteParam as getRouteMapParam
} from 'source/common/module/RouteMap'
import { BASIC_EXTENSION_MAP } from 'source/common/module/MIME'

import { COMMON_LAYOUT, COMMON_STYLE } from 'source/node/server/commonHTML'
import { responderSendBufferCompress, prepareBufferData } from './Send'

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

const appendRouteMap = (routeMap, route = '/', method = 'GET', routeResponder) => {
  if (Array.isArray(route)) return route.reduce((o, v) => appendRouteMap(routeMap, v, method, routeResponder), routeMap)
  if (Array.isArray(method)) return method.reduce((o, v) => appendRouteMap(routeMap, route, v, routeResponder), routeMap)
  const { routeNode, paramNameList } = parseRouteToMap(routeMap, route)
  if (!METHOD_MAP[ method ]) throw new Error(`[appendRouteMap] invalid method [${method}] for route: ${route}`)
  if (routeNode[ METHOD_MAP[ method ] ]) throw new Error(`[appendRouteMap] duplicate method [${method}] for route: ${route}`)
  if (typeof (routeResponder) !== 'function') throw new Error(`[appendRouteMap] invalid routeResponder for route: ${route}`)
  routeNode[ METHOD_MAP[ method ] ] = { route, paramNameList, routeResponder }
  return routeMap
}

const createRouteMap = (configList) => configList.reduce((o, [ route, method, routeResponder ]) => appendRouteMap(o, route, method, routeResponder), {})

const createResponderRouter = (routeMap) => (store) => {
  const { url, method } = store.getState()
  if (!url || !method) throw new Error(`[responderRouter] missing state: ${JSON.stringify({ url, method })}`)
  if (!METHOD_MAP[ method ]) throw new Error(`[responderRouter] invalid method [${method}] from route: ${url.pathname}`)

  const { routeNode, paramValueList } = findRouteFromMap(routeMap, url.pathname)

  if (!routeNode[ METHOD_MAP[ method ] ]) throw new Error(`[responderRouter] invalid method [${method}] for route: ${url.pathname}`)
  const { route, paramNameList, routeResponder } = routeNode[ METHOD_MAP[ method ] ]
  const paramMap = paramNameList.reduce((o, paramName, index) => {
    o[ paramName ] = paramValueList[ index ]
    return o
  }, {})

  return routeResponder(store, store.setState({ route, paramMap }))
}

const getRouteParamAny = (store) => getRouteMapParamAny(store.getState())
const getRouteParam = (store, paramName) => getRouteMapParam(store.getState(), paramName)

const describeRouteMap = (routeMap) => {
  const routeInfoList = [ /* { method, route } */ ]
  const methodValueSet = new Set(Object.values(METHOD_MAP))
  objectDepthFirstSearch(routeMap, (value, key) => { methodValueSet.has(key) && routeInfoList.push({ method: key, route: value.route }) })
  return routeInfoList
}

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

const createResponderRouteList = (getRouterMap, extraBodyList) => {
  let bufferData
  return async (store) => {
    if (bufferData === undefined) bufferData = await prepareBufferData(Buffer.from(getRouteListHTML(getRouterMap(), extraBodyList)), BASIC_EXTENSION_MAP.html)
    return responderSendBufferCompress(store, bufferData)
  }
}

const getRouteListHTML = (routeMap, extraBodyList = []) => COMMON_LAYOUT([
  COMMON_STYLE(),
  '<style>body { overflow: auto; align-items: start; }</style>'
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
  createResponderRouteList
}
