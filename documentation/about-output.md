# About Output

build output pack with `npm run script-pack`

the output file is like:
```
output-gitignore/
├── bin
│   ├── index.js
│   └── ...
├── library
│   ├── env
│   ├── common
│   ├── node
│   └── Dr.browser.js
├── module
│   ├── env
│   ├── common
│   ├── node
│   └── browser
├── package.json
├── LICENSE
└── README.md
```

# bin

for CLI usage, try `npx dr-js -h`


# module

designed for develop & re-pack, keep ES6 module `import` & `export`
comment is dropped, but should still be easy to read

for most package with bundling & tree-shaking process
this should be the code to use


# library

designed for direct node `require()` usage, 
code is minified, so kinda hard to read,
but has line break for better debug locating (not a super long line)

for direct use as a package `dependency`

but for project use ES6 module code with IDE & babel,
it's recommended to add `babel-plugin-module-resolver`,
and edit `babel.config.js` as:
```js
const isModule = false
module.exports = {
  plugins: [
    [ 'module-resolver', { alias: isModule ? undefined : { 'dr-js/module/(.+)': 'dr-js/library/' } } ]
  ]
}
```
this way,
in source code you can still `import { ... } from 'dr-js/module/...'`,
and the output code will be `const { ... } = require('dr-js/library/...')`,
for IDE with code analysis, module based code will generate more help info
