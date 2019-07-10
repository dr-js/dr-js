# dr-js

[![i:npm]][l:npm]
[![i:ci]][l:ci]
[![i:size]][l:size]
[![i:npm-dev]][l:npm]

A collection of strange functions

[i:npm]: https://img.shields.io/npm/v/dr-js.svg?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/dr-js/dev.svg
[l:npm]: https://npm.im/dr-js
[i:ci]: https://img.shields.io/travis/dr-js/dr-js/master.svg
[l:ci]: https://travis-ci.org/dr-js/dr-js
[i:size]: https://packagephobia.now.sh/badge?p=dr-js
[l:size]: https://packagephobia.now.sh/result?p=dr-js

[//]: # (NON_PACKAGE_CONTENT)

- 📁 [source/](source/)
  - main source code, in output package will be:
    - `dr-js/library`: for direct use, use `require() / exports.*=` and has `Dr.browser.js`
    - `dr-js/module`: for re-pack, keep `import / export` and readability
- 📁 [source-bin/](source-bin/)
  - bin source code, in output package will be `dr-js/bin`
- 📁 [example/](example/)
  - some example (unsorted tests)
- 📁 [documentation/](documentation/)
  - a few random documentation
- 📄 [SPEC.md](SPEC.md)
  - list of all directly accessible codes, sort of an API lockfile
