# Feature

A server feature is a folder of related code providing one function.


## The `setup.js` file

Most feature will have a `setup.js` like:
```js
const setup = async ({
  name = 'feature:do-some-work',
  serverExot, loggerExot, routePrefix = '', // basic option
  featureDependPack0, featureDependPack1, // some other feature required for this feature, often Auth
  ...extraOption
}) => ({
  ...extraData, ...extraMethod, // for other feature or outer code to interact with this feature
  URL_0, URL_1, // some url for this feature (full path without host, like `/feat/A/0`)
  routeList, webSocketRouteList, // route list for HTTP or WS
  exotList, // list exot to up/down in normal/reverse order along with the serverExot
  name
})

export { setup }
```


## The HTML hack

The client HTML is packed along with the server js, in `HTML.js` or `HTML/*.js`, using a `function.toString()` hack.

The `function.toString()` hack has some limitations:
- the function cannot have `require`/`import` inside
- all function must get other module function by passing in as arguments,
    or from `window` within the function code,
    since the code string will cannot preserve the reference.
and some pros:
- the client code can stay with server code
- support webpack
- support most JS minify/uglify which do not pull function out of other function's scope
- allow specially configured Babel.js to change the code, just tell it to always inline helper function
