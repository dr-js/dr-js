# dr-js

[![i:npm]][l:npm]
[![i:ci]][l:ci]
[![i:size]][l:size]
[![i:lint]][l:lint]
[![i:npm-dev]][l:npm]

A collection of strange functions

[i:npm]: https://img.shields.io/npm/v/dr-js.svg?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/dr-js/dev.svg
[l:npm]: https://www.npmjs.com/package/dr-js
[i:ci]: https://img.shields.io/travis/dr-js/dr-js/master.svg
[l:ci]: https://travis-ci.org/dr-js/dr-js
[i:size]: https://packagephobia.now.sh/badge?p=dr-js
[l:size]: https://packagephobia.now.sh/result?p=dr-js
[i:lint]: https://img.shields.io/badge/code_style-standard-yellow.svg
[l:lint]: https://standardjs.com

[//]: # (NON_PACKAGE_CONTENT)

#### Code
- 📁 [source](source)
  - main source code, in output package will be:
    - `dr-js/library`: for direct use, use `require() / exports=` and has `Dr.browser.js`
    - `dr-js/module`: for re-pack, keep `import / export` and readability
- 📁 [source-bin](source-bin)
  - bin source code, in output package will be `dr-js/bin`

#### Reference
- 📄 [SPEC.md](SPEC.md)
  - list of all directly accessible codes, sort of an API lockfile
- 📁 [example](example)
  - some example (unsorted tests)
