# Mix Browser JS in Node


> NOTE: this is mostly a stacked up hack

It's good to be able to pack the HTML/CSS/BrowserJS with the server code,
  and share all those build tools.

The idea:
- HTML: just use `string`
- CSS: just use `string`
- BrowserJS: the hack of `function.toString()`:
  - if all the browser js is inside a single `function`, with no outer `function` referenced, 
    then with `function.toString()` and wrapping the result string in a `<script>` tag,
    the code will continue to work, and the function is defined under `window`,
    we call the big function a `initFunction`
  - if put all `<script>` tag of `initFunction` in correct order,
    then they can "require" each other inside the code,
    by pulling code out of `window`, this way the referenced limit is bypassed,
    and the code can be separated and provided in smaller chunks

The limitation:
- `babel` injected code must be limited with specific config,
  if a helper is added and linked outside of `initFunction`,
  `function.toString()` will not have all the code,
  and output code better be ES8+,
  since `Promise & async/await` can't easily be patched inline,
  also config `babel` plugin to use `loose: true, useBuiltIns: true`
- `webpack` & `uglify` should be good,
  as long as the code in function don't get pulled out
- check and test the result,
  check and test the result,
  check and test the result

Code sample:
- 📄 [HTML.js](./HTML.js)
- 📄 [source-bin/server/websocketGroup.js](../../../source-bin/server/websocketGroup.js)
