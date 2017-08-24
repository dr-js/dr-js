const ROUTE_ANY = '/*/'
const ROUTE_PARAM = '/:PARAM/'
const HTTP_REQUEST_METHOD_LIST = [ 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE' ]
const ROUTE_METHOD_LIST = HTTP_REQUEST_METHOD_LIST.map((method) => `/${method}/`)
const HTTP_REQUEST_METHOD_MAP = HTTP_REQUEST_METHOD_LIST.reduce((o, method, index) => {
  o[ method ] = ROUTE_METHOD_LIST[ index ]
  return o
}, {})

const DEFAULT_ROUTE_PROCESSOR = (store, { route, method, paramMap }) => {}

// const SAMPLE_ROUTE_MAP = {
//   '': { // '/'
//     [HTTP_REQUEST_METHOD_MAP[ 'GET' ]]: DEFAULT_ROUTE_PROCESSOR
//   },
//   user: { // '/user'
//     [ROUTE_PARAM]: { // '/user/:userId'
//       [HTTP_REQUEST_METHOD_MAP[ 'GET' ]]: DEFAULT_ROUTE_PROCESSOR,
//       [HTTP_REQUEST_METHOD_MAP[ 'DELETE' ]]: DEFAULT_ROUTE_PROCESSOR
//     }
//   },
//   users: { // '/users'
//     '': { // '/users/'
//       [HTTP_REQUEST_METHOD_MAP[ 'GET' ]]: DEFAULT_ROUTE_PROCESSOR
//     }
//   },
//   static: { // '/static'
//     [ROUTE_ANY]: { // '/static/*'
//       [HTTP_REQUEST_METHOD_MAP[ 'GET' ]]: DEFAULT_ROUTE_PROCESSOR
//     }
//   }
// }

const addRouteToRouterMap = (routerMap, route = '/', method = 'GET', routeProcessor = DEFAULT_ROUTE_PROCESSOR) => {
  let currentNode = routerMap
  const paramNameList = []

  // route
  route.split('/').forEach((frag) => {
    if (frag === '*') {
      if (currentNode[ ROUTE_ANY ]) throw new Error(`[Router] duplicate [*] for route: ${route}`)
      currentNode[ ROUTE_ANY ] = {}
      currentNode = currentNode[ ROUTE_ANY ]
      paramNameList.push(ROUTE_ANY) // as paramName
    } else if (frag[ 0 ] === ':') { // /:paramName
      if (currentNode[ ROUTE_PARAM ] === undefined) currentNode[ ROUTE_PARAM ] = {}
      currentNode = currentNode[ ROUTE_PARAM ]
      paramNameList.push(frag.slice(1)) // paramName
    } else { // /frag
      if (currentNode[ frag ] === undefined) currentNode[ frag ] = {}
      currentNode = currentNode[ frag ]
    }
  })

  // method
  if (!HTTP_REQUEST_METHOD_MAP[ method ]) throw new Error(`[Router] error method [${method}] for route: ${route}`)
  if (currentNode[ HTTP_REQUEST_METHOD_MAP[ method ] ]) throw new Error(`[Router] duplicate method [${method}] for route: ${route}`)
  currentNode[ HTTP_REQUEST_METHOD_MAP[ method ] ] = { route, paramNameList, routeProcessor }

  return routerMap
}

const createRouterMapBuilder = (routerMap = {}) => ({
  ROUTE_ANY,
  ROUTE_PARAM,
  addRoute: (route, method, routeProcessor) => addRouteToRouterMap(routerMap, route, method, routeProcessor),
  getRouterMap: () => {
    const resultRouterMap = routerMap
    routerMap = {}
    return resultRouterMap
  }
})

const createResponderRouter = (routerMap) => (store) => {
  const { url, method } = store.getState()

  __DEV__ && (!url || !method) && console.log('[Router] missing arguments', { url, method })
  if (!url || !method) return

  let paramValueList = []
  let currentNode = routerMap
  const routeString = url.pathname
  const routeFragList = routeString.split('/')

  // route
  routeFragList.find((frag, index) => {
    if (currentNode[ frag ]) { // hit frag
      currentNode = currentNode[ frag ]
    } else if (currentNode[ ROUTE_PARAM ]) { // check :param
      currentNode = currentNode[ ROUTE_PARAM ]
      paramValueList.push(frag)
    } else if (currentNode[ ROUTE_ANY ]) { // check *
      currentNode = currentNode[ ROUTE_ANY ]
      paramValueList.push(routeFragList.slice(index).join('/'))
      return true
    } else throw new Error(`[Router] stuck at [${frag}] for route: ${routeString}`)
  })

  // node info
  const { route, paramNameList, routeProcessor } = (currentNode && currentNode[ HTTP_REQUEST_METHOD_MAP[ method ] ]) || {}
  if (__DEV__ && (!route || !paramNameList || !routeProcessor)) throw new Error(`[Router] invalid node info for: [${method}] ${routeString}`)
  const paramMap = paramNameList.reduce((o, paramName, index) => {
    o[ paramName ] = paramValueList[ index ]
    return o
  }, {})
  store.setState({ route, paramMap })
  return routeProcessor(store) // async
}

export {
  createRouterMapBuilder,
  createResponderRouter
}
