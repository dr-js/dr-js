# Server Design


> This intro assumes basic experience of raw Node.js HTTP server API,
>   the basic server design is simple,
>   but without knowing the inner code, some choice and trade-off made maybe hard to follow.
> And most detail should be found in actual code, which is not much, please do have a look.

First, the concept list:
- `Server`: plain Node.js [http(s).Server](https://nodejs.org/api/http.html#http_class_http_server)
- `Request`: plain Node.js [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
- `RequestListener`: create `store` for each `Request`, holding state and reference to request/response, then send through `Responder`
- `Responder`: async function pattern, the unit to process request, designed to allow nesting
- `Router`: pre-configured map to match `store` to `Responder` by request route (url path)

The basic setup flow is:
- create all utility `Responder`
- create & configure `Router` to map all those `Responder`
- create `ResponderRouter` from `Router`
- create `Server` but don't start yet
- attach `RequestListener` to `Server` to pass each request `store` to `ResponderRouter`
- start `Server` and listen for requests


#### 📄 [Server.js](./Server.js)

The code for `Server` and `RequestListener` setup.

The server is packed as an [Exot](../../common/module/Exot.md).

The `RequestListener` accept a main list of `Responder`,
  and two extra `responderEnd` and `responderError` for clean up, inspired by `Promise`.


#### 📁 [Responder/](./Responder/)

This is where most of the code would be.

A `Responder` is an async function with the pattern:
```js
async (store, ...extraArgs) => {}
```
Where `store` is from `RequestListener`,
  and most of the time should be enough for passing data without `extraArgs`.

`Responder` is composable,
  a `Responder` can `await` more inner `Responder`,
  so there's `ResponderRouter` assign `store` to one of many inner route `Responder`.
  
To correctly process HTTP, only one `Send` typed `Responder` should be used,
  since the HTTP response can't be more than one.

The default fallback in `RequestListener` will check if the response is sent,
  and close with `400` for missed requests, `500` for errored ones.

Most of the time, the pattern `createResponder*()` should be used to allow user customization.

For basic example, check: 📄 [Server.test.js](./Server.test.js)


## `Feature`

To separate the server setup and the code run on it, like most framework do,
  the `Feature` pattern is used.

Here a `Feature` is a folder of codes, together providing some utility.

As a `Feature` in a server,
  it should define some route in a `routeList`,
  then do the work in `Responder` code,
  optionally also serve some HTML,
  all this is called a `featurePack`.

The basic code of `featurePack` should be like: (for more sample, check [Feature/](./Feature/))
```js
const setup = async ({
  option, // server option
  routePrefix = '', // route prefix/namespace, so upper code can relocate this feature
  ...featureSpecificConfig
}) => {
  // define the route path
  const URL_FEATURE_A = `${routePrefix}/feature-a`
  const URL_FEATURE_B = `${routePrefix}/feature-b`
  
  // configure the responder
  const responderA = (store) => {}
  const responderIndex = (store) => {}

  const routeList = [
    [ URL_FEATURE_A, 'GET', responderA ],
    [ URL_FEATURE_B, [ 'GET', 'HEAD' ], responderIndex ],
  ]

  return { // return routeList and maybe more data
    URL_FEATURE_A,
    URL_FEATURE_B,
    routeList
  }
}
```

And a `serverExot` can be configured like:
```js
const configureServer = async ({
  serverExot: { server, option },
  featureConfigA = {},
  featureConfigB = {}
}) => {
  // route & feature pack
  const featureA = await setupFeatureA({ option, ...featureConfigA })
  const featureB = await setupFeatureB({ option, routeRoot: '/feat-b', featureA, ...featureConfigB })
  const routeMap = createRouteMap([
    ...featureA.routeList,
    ...featureB.routeList,
    [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
  ].filter(Boolean))

  server.on('request', createRequestListener({ // attach routeResponder to server
    responderList: [ createResponderRouter({ routeMap, baseUrl: option.baseUrl }) ]
  }))
}
```

This way, Node.js server code can be divided to packages like:
- featureA + library
- featureB + library
- ...
- server setup + CLI config, and import feature package above
