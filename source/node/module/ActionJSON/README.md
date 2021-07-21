# ActionJSON

Action with both input and output in JSON.

The action type should be URL-safe string, since it'll be added to the route path of request URL, allow for early drop non-exist action.
The action payload should be pure JSON, passed though request body.
The corresponding respond will also be pure JSON.

For the action code, the base form is:
```js
async (store, actionPayloadJSON) => respondJSON
```

And it's common to store the simpler action core func in `ACTION_CORE_MAP`,
  then use code to pass in config value and normalize input arguments,
  like:
```js
const setupActionMap = async ({
  actionCoreMap = ACTION_CORE_MAP,
  ...extraConfig,
  loggerExot
}) => actionMap
```

If there's buffer involved, like `FileChunkUpload`,
  just code as `responder` should be fine.
Or maybe add `ActionPacket` later with `ArrayBufferPacket` as the transport format.
