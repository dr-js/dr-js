const ROUTE_ANY = '/*'
const ROUTE_PARAM = '/:PARAM'
const ROUTE_DATA = '/DATA'

const nextObject = (object, key) => object[ key ] === undefined ? (object[ key ] = {}) : object[ key ]

const parseRouteToMap = (routeNode, route) => {
  const paramNameList = []
  routeNode = route.split('/').reduce((routeNode, frag) => {
    if (frag === '*') { // /*
      paramNameList.push(ROUTE_ANY)
      return nextObject(routeNode, ROUTE_ANY)
    } else if (frag[ 0 ] === ':') { // /:PARAM
      const paramName = frag.slice(1)
      if (!paramName || paramNameList.includes(paramName)) throw new Error(`invalid frag [${frag}] for route: ${route}`)
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
    } else return
  }
  return { routeNode, paramValueList }
}

const appendRouteMap = (routeMap = {}, route = '/', data) => {
  if (Array.isArray(route)) return route.reduce((o, v) => appendRouteMap(routeMap, v, data), routeMap)
  const { routeNode, paramNameList } = parseRouteToMap(routeMap, route)
  if (routeNode[ ROUTE_DATA ]) throw new Error(`duplicate route: ${route}`)
  routeNode[ ROUTE_DATA ] = { route, paramNameList, data }
  return routeMap
}

const createRouteMap = (configList) => configList.reduce((o, [ route, data ]) => appendRouteMap(o, route, data), {})

const parseRouteUrl = (routeMap, url) => {
  const routeData = findRouteFromMap(routeMap, url)
  if (routeData === undefined) return
  const { routeNode, paramValueList } = routeData
  if (routeNode[ ROUTE_DATA ] === undefined) return
  const { route, paramNameList, data } = routeNode[ ROUTE_DATA ]
  const paramMap = paramNameList.reduce((o, paramName, index) => {
    o[ paramName ] = paramValueList[ index ]
    return o
  }, {})
  return { route, paramMap, data }
}

const getRouteParamAny = ({ paramMap }) => paramMap[ ROUTE_ANY ]
const getRouteParam = ({ paramMap }, paramName) => paramMap[ paramName ]

export {
  parseRouteToMap,
  findRouteFromMap,
  appendRouteMap,
  createRouteMap,
  parseRouteUrl,
  getRouteParamAny,
  getRouteParam
}
