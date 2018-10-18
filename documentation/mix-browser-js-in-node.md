# Mix Browser JS in Node

###### NOTE: this is mostly a stacked up hack

it's good to pack the HTML/CSS/BrowserJS in the server code,
and share the build process

idea:
- HTML - just use `string`
- CSS - just use `string`
- BrowserJS - the hack: `function.toString()`
  - if all the browser js is inside a single `function`,
    with no outer `function` needed, 
    then by `function.toString()` and put the result string in a `<script>`,
    the code should continue to work,
    the big function can be called the `initFunction`
  - set all `initFunction` on `window`,
    then they can "require" each other inside the code,
    this way the code can be separated and provided in smaller chunks

limitation:
- `babel` inject code must be limited, 
  if a helper is added and linked outside of `initFunction`,
  `function.toString()` will not have all the code,
  output code better be ES8,
  since `Promise & async/await` can't be easily patched inline,
  config `babel` plugin to use `loose: true, useBuiltIns: true`
- `webpack` & `uglify` should be good,
  as long as the code in function don't get pulled out
- check and test the result,
  check and test the result,
  check and test the result

code sample:
- 📄 [source/node/server/commonHTML.js](../source/node/server/commonHTML.js)
- 📄 [source-bin/server/websocketGroup.js](../source-bin/server/websocketGroup.js)
