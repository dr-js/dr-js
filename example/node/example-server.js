const nodeModulePath = require('path')
const Dr = require('../Dr.node')

console.log(Object.keys(Dr))
console.log(Object.keys(Dr.Node))

const {
  createServer,
  applyResponseReducerList,
  ResponseReducer: {
    createResponseReducerParseURL,
    createRouterMapBuilder,
    createResponseReducerRouter,
    createResponseReducerServeStatic,
    createResponseReducerServeStaticSingleCached
  }
} = Dr.Node.Server

const fromPath = (...args) => nodeModulePath.join(__dirname, ...args)

const responseReducerServeStatic = createResponseReducerServeStatic({ staticRoot: fromPath('../') })
const responseReducerServeFavicon = createResponseReducerServeStaticSingleCached({ staticFilePath: fromPath('../browser/favicon.ico') })

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/favicon', 'GET', responseReducerServeFavicon)
routerMapBuilder.addRoute('/favicon.ico', 'GET', responseReducerServeFavicon)
routerMapBuilder.addRoute('/static/*', 'GET', (store) => {
  store.setState({ filePath: store.getState().paramMap[ routerMapBuilder.ROUTE_ANY ] })
  return responseReducerServeStatic(store)
})

const { server, start } = createServer({ port: 3000 }, 'HTTP')

applyResponseReducerList(server, [
  createResponseReducerParseURL(),
  createResponseReducerRouter(routerMapBuilder.getRouterMap())
])

start()
