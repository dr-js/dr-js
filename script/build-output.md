# About Build Output


## Build Output

Build output pack with `npm run script-pack`,
  and the output will be like:
```
output-gitignore/
├── bin/
├── module/
├── library/
├── package.json
├── LICENSE
└── README.md
```

#### `./bin/`

Code for CLI usage,
  try `node output-gitignore/bin -h` after build,
  or directly `npx @dr-js/core -h`.

#### `./module/`

Code designed for re-use & re-pack,
  so as much ES6+ and `import` & `export` is preserved for better readability,
  though comment is dropped, should still be easy to read.

For most package with bundling & tree-shaking tooling,
  this should be the code to `import` from.

#### `./library/`

Code designed for direct Node.js `require()` usage, 
  the code is minified, so harder to read,
  but kept line break for better debug locating.

For direct use as a package `dependency`, and referenced from `./bin/` code.


## development setup

For project use ES6 module code with IDE & babel,
  it's recommended to add `babel-plugin-module-resolver`,
  then edit `babel.config.js` as:
```js
const isModule = false
module.exports = {
  plugins: [
    [ 'module-resolver', { alias: isModule ? undefined : { '@dr-js/core/module/(.+)': '@dr-js/core/library/' } } ]
  ]
}
```

This way,
  in source code you can still `import { ... } from '@dr-js/core/module/...'`,
  and the output code will be `const { ... } = require('@dr-js/core/library/...')`,
  for IDE with code analysis, module based ES6+ code will generate more helpful info.
