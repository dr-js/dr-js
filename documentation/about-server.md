# About Server

📁 [source/node/server/](../source/node/server/)

the concept list:
- server: plain node http/https server
- store: created for each request, a place to hold state
- responder: unit to process request, a pattern, an async function
- router/route: to match request url path, very simple match

#### server

📄 [source/node/server/Server.js](../source/node/server/Server.js)

very basic server, listen to a port, and understand HTTP protocol,
no added extra logic

the server you get is created with module from node,
do check: https://nodejs.org/dist/latest/docs/api/http.html
```js
import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
```

check the function: `createServer()`, basically:
```js
const createServer = (option) => ({ // option check `DEFAULT_HTTPS_OPTION` and `DEFAULT_HTTP_OPTION`
  server, // from createHttpServer or createHttpsServer
  option,
  start: () => {},
  stop: () => {}
})
```


#### store

📄 [source/node/server/Server.js](../source/node/server/Server.js)

created for each request, to keep a immutable state, 
has `getState()` & `setState()` (check `createStateStoreLite()`)

- `store.request` is from node, check: https://nodejs.org/dist/latest/docs/api/http.html#http_class_http_incomingmessage
- `store.response` is from node, check: https://nodejs.org/dist/latest/docs/api/http.html#http_class_http_serverresponse
- `storeState` is like Redux state, initially will set `time` & `error`,
  in common setup, `url` & `method` will later be set by responder from `createResponderParseURL()`

the function `createRequestListener()` is used to bind responder (later), 
and create store for each incoming request:
```js
const createRequestListener = ({
  responderList = [],
  responderEnd = DEFAULT_RESPONDER_END,
  responderError = DEFAULT_RESPONDER_ERROR
}) => async (request, response) => {
  const stateStore = createStateStoreLite({
    time: clock(), // in msec, relative
    error: null // from failed responder
  })
  stateStore.request = request
  stateStore.response = response
  try {
    for (const responder of responderList) await responder(stateStore)
  } catch (error) { await responderError(stateStore, error) }
  await responderEnd(stateStore)
}
```


#### responder

📁 [source/node/server/Responder/](../source/node/server/Responder/)

where most of the code should be

a responder get data from `store.request`, 
and send result data to `store.response`,
as an `async` function

basically:
```js
const responder = async (store) => {}
```

this allows responder to `await` more responder inside

most of the time, `createResponderParseURL()` and `createResponderRouter()` should be used,
for example, check: 📄 [source/node/server/Server.test.js](../source/node/server/Server.test.js)


#### router/route

📄 [source/node/server/Responder/Router.js](../source/node/server/Responder/Router.js)

simple router is also included

a `route` data is like:
```js
const route = [ 
  '/route/path/:with-param', // route string, support simple `:param` and `*`
  'GET', // HTTP method
  async (store) => {} // responder
]
```

a `routeList` for `createRouteMap()` looks like:
```js
const routeList = [
  [ '/test-basic', 'GET', (store, state) => ({ ...state, tag: 'A' }) ],
  [ '/test-param-any/*', 'GET', (store, state) => ({ ...state, tag: 'B' }) ],
  [ '/test-param-a/:param-a', 'GET', (store, state) => ({ ...state, tag: 'C' }) ],
  [ '/test-param-b/:param-b/:param-c/:param-d/eee', [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'D' }) ],
  [ [ '/', '/test/' ], [ 'GET', 'HEAD' ], (store, state) => ({ ...state, tag: 'E' }) ],
  [ '/test', [ 'POST', 'HEAD' ], (store, state) => ({ ...state, tag: 'F' }) ]
]
```

first create `routeMap` from `routeList` with `createRouteMap()`,
then create route responder with `createResponderRouter()`
in responder, you can get routeParam with `getRouteParam` or `getRouteParamAny`

for example, check: 📄 [source/node/server/Responder/Router.test.js](../source/node/server/Responder/Router.test.js)

also some server with more specific function: 📁 [source-bin/server/](../source-bin/server/)
