import {
  parseRouteToMap,
  findRouteFromMap,
  getRouteParamAny as getRouteMapParamAny,
  getRouteParam as getRouteMapParam
} from 'source/common/module'

const METHOD_MAP = {
  GET: '/GET',
  PUT: '/PUT',
  POST: '/POST',
  HEAD: '/HEAD',
  PATCH: '/PATCH',
  DELETE: '/DELETE'
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

export {
  createRouteMap,
  createResponderRouter,
  appendRouteMap,
  getRouteParamAny,
  getRouteParam
}
