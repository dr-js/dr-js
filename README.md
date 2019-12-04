# @dr-js/core

[![i:npm]][l:npm]
[![i:ci]][l:ci]
[![i:size]][l:size]
[![i:npm-dev]][l:npm]

A collection of strange functions

[i:npm]: https://img.shields.io/npm/v/@dr-js/core?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/@dr-js/core/dev
[l:npm]: https://npm.im/@dr-js/core
[i:ci]: https://img.shields.io/github/workflow/status/dr-js/dr-js/ci-test
[l:ci]: https://github.com/dr-js/dr-js/actions?query=workflow:ci-test
[i:size]: https://packagephobia.now.sh/badge?p=@dr-js/core
[l:size]: https://packagephobia.now.sh/result?p=@dr-js/core

[//]: # (NON_PACKAGE_CONTENT)

- 📁 [source/](source/)
  - main source code, in output package will be:
    - `@dr-js/core/library`: for direct use, use `require() / exports.*=` and has `Dr.browser.js`
    - `@dr-js/core/module`: for re-pack, keep `import / export` and readability
- 📁 [source-bin/](source-bin/)
  - bin source code, in output package will be `@dr-js/core/bin`
- 📁 [example/](example/)
  - some example (unsorted tests)
- 📁 [documentation/](documentation/)
  - a few random documentation
- 📄 [SPEC.md](SPEC.md)
  - list of all directly accessible codes, sort of an API lockfile
