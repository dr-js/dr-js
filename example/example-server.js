const Dr = require('./Dr.node.js')
const nodeModulePath = require('path')

console.log(Object.keys(Dr))
console.log(Object.keys(Dr.Node))

const {
  createServer,
  applyResponseReducerList,
  ResponseReducer: {
    // responseReducerLogState,
    createResponseReducerParseURL,
    // createResponseReducerReceiveBuffer,
    createResponseReducerServeStatic,
    createRouterMapBuilder,
    createResponseReducerRouter
  }
} = Dr.Node.Server

const responseReducerServeStatic = createResponseReducerServeStatic(nodeModulePath.join(__dirname, '.'))

const routerMapBuilder = createRouterMapBuilder()
routerMapBuilder.addRoute('/favicon.ico') // do nothing
routerMapBuilder.addRoute('/static/*', 'GET', (store, { paramMap }) => responseReducerServeStatic(store, paramMap[ routerMapBuilder.ROUTE_ANY ]))

// console.log(__dirname)
// console.log(JSON.stringify(routerMap))

const { server, start } = createServer()
applyResponseReducerList(server, [
  createResponseReducerParseURL(),
  createResponseReducerRouter(routerMapBuilder.getRouterMap())
  // createResponseReducerReceiveBuffer(),
  // responseReducerLogState
])

start()
