const ROUTE_ANY = '/*'
const ROUTE_PARAM = '/:PARAM'
const METHOD_MAP = {
  GET: '/GET',
  PUT: '/PUT',
  POST: '/POST',
  HEAD: '/HEAD',
  PATCH: '/PATCH',
  DELETE: '/DELETE'
}

const nextObject = (object, key) => object[ key ] === undefined ? (object[ key ] = {}) : object[ key ]

const parseRouteToMap = (routeNode, route) => {
  const paramNameList = []
  routeNode = route.split('/').reduce((routeNode, frag) => {
    if (frag === '*') { // /*
      if (routeNode[ ROUTE_ANY ]) throw new Error(`[parseRouteToMap] duplicate [*] for route: ${route}`)
      paramNameList.push(ROUTE_ANY)
      return nextObject(routeNode, ROUTE_ANY)
    } else if (frag[ 0 ] === ':') { // /:PARAM
      const paramName = frag.slice(1)
      if (!paramName || paramNameList.includes(paramName)) throw new Error(`[parseRouteToMap] invalid frag [${frag}] for route: ${route}`)
      paramNameList.push(paramName)
      return nextObject(routeNode, ROUTE_PARAM)
    } else return nextObject(routeNode, frag) // /frag
  }, routeNode)
  return { routeNode, paramNameList }
}

const findRouteFromMap = (routeNode, route) => {
  const paramValueList = []
  const routeFragList = route.split('/')
  for (let index = 0, indexMax = routeFragList.length; index < indexMax; index++) {
    const frag = routeFragList[ index ]
    if (routeNode[ frag ]) routeNode = routeNode[ frag ] // hit frag
    else if (routeNode[ ROUTE_PARAM ]) {
      paramValueList.push(frag)
      routeNode = routeNode[ ROUTE_PARAM ]
    } else if (routeNode[ ROUTE_ANY ]) {
      paramValueList.push(routeFragList.slice(index).join('/')) // set all follow-up fragList
      routeNode = routeNode[ ROUTE_ANY ]
      break
    } else throw new Error(`[findRouteFromMap] stuck at [${frag}] for route: ${route}`)
  }
  return { routeNode, paramValueList }
}

const addRouteToRouterMap = (routerMap, route = '/', method = 'GET', routeResponder) => {
  const { routeNode, paramNameList } = parseRouteToMap(routerMap, route)
  if (!METHOD_MAP[ method ]) throw new Error(`[addRouteToRouterMap] invalid method [${method}] for route: ${route}`)
  if (routeNode[ METHOD_MAP[ method ] ]) throw new Error(`[addRouteToRouterMap] duplicate method [${method}] for route: ${route}`)
  if (typeof (routeResponder) !== 'function') throw new Error(`[addRouteToRouterMap] invalid routeResponder for route: ${route}`)
  routeNode[ METHOD_MAP[ method ] ] = { route, paramNameList, routeResponder }
  return routerMap
}

const createRouterMap = (configList) => configList.reduce((o, config) => addRouteToRouterMap(o, ...config), {})

const createResponderRouter = (routerMap) => (store) => {
  const { url, method } = store.getState()
  if (!url || !method) throw new Error(`[createResponderRouter] missing state: ${JSON.stringify({ url, method })}`)

  const { routeNode, paramValueList } = findRouteFromMap(routerMap, url.pathname)
  if (!routeNode || !routeNode[ METHOD_MAP[ method ] ]) throw new Error(`[createResponderRouter] invalid node info for: [${method}] ${url.pathname}`)
  const { route, paramNameList, routeResponder } = routeNode[ METHOD_MAP[ method ] ]
  const paramMap = paramNameList.reduce((o, paramName, index) => {
    o[ paramName ] = paramValueList[ index ]
    return o
  }, {})

  return routeResponder(store, store.setState({ route, paramMap }))
}

const getRouteParamAny = (store) => store.getState().paramMap[ ROUTE_ANY ]
const getRouteParam = (store, paramName) => store.getState().paramMap[ paramName ]

// const SAMPLE_ROUTE_RESPONDER = (store, { url, route, method, paramMap }) => {}
// const SAMPLE_RESULT_ROUTE_MAP = {
//   // GET /users/list
//   // GET /users/
//   // GET /users
//   users: {
//     list: { '/GET': DEFAULT_ROUTE_PROCESSOR },
//     '': { '/GET': DEFAULT_ROUTE_PROCESSOR },
//     '/GET': DEFAULT_ROUTE_PROCESSOR
//   },
//   // GET '/'
//   '': { '/GET': DEFAULT_ROUTE_PROCESSOR },
//   // GET '/static/*'
//   static: { '/*': { '/GET': DEFAULT_ROUTE_PROCESSOR } },
//   // DELETE '/user/:userId'
//   user: { '/:PARAM': { '/DELETE': DEFAULT_ROUTE_PROCESSOR } }
// }

export {
  createRouterMap,
  createResponderRouter,
  addRouteToRouterMap,
  getRouteParamAny,
  getRouteParam
}
