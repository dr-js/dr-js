# dr-js

[![i:npm]][l:npm]
[![i:ci]][l:ci]
[![i:size]][l:size]
[![i:npm-dev]][l:npm]

A collection of strange functions

[i:npm]: https://img.shields.io/npm/v/dr-js?colorB=blue
[i:npm-dev]: https://img.shields.io/npm/v/dr-js/dev
[l:npm]: https://npm.im/dr-js
[i:ci]: https://img.shields.io/github/actions/workflow/status/dr-js/dr-js/.github/workflows/ci-test-2312.yml
[l:ci]: https://github.com/dr-js/dr-js/actions?query=workflow:ci-test-2312
[i:size]: https://packagephobia.now.sh/badge?p=dr-js
[l:size]: https://packagephobia.now.sh/result?p=dr-js

[//]: # (NON_PACKAGE_CONTENT)

- 📁 [esm/](esm/)
  - main source code, in output package will be: `dr-js/esm/`
- 📁 [bin/](bin/)
  - bin source code, in output package will be: `dr-js/bin/`
- 📁 [example/](example/)
  - some example (unsorted tests)
- 📄 [SPEC.md](SPEC.md)
  - list all cli options

All source code use `.js` suffix, and target ES2021 with ES module.  
The source code should be directly runnable, no compiler/bundler magic.  
All test code use `.test.js` suffix or under `*.test/` dir, and run in target JS runtime.  

Under `esm/`, the layout matches the target JS runtime:
- `base/`: baseline, pure ES2021 with ES module, no import from other top-level dir
- `node/`: with Node.js-specific API (like `node:fs`..) and some npm wrapper, target `node24.18 npm11.10`, can import from `base/`
- `qjs/`: with QuickJS-specific API (like `std`, `os`), target `quickjs@2026-06-04`, can import from `base/`
- `web/`: with browser-specific API (like DOM, CSS, Canvas..), target `chrome80 firefox80 safari14.1 edge80`, can import from `base/`

Some inner layouts:
- `base/env/`: code to detect current JS runtime
- `node/server/`: code to build Node.js server
- `node/dev/`: code to manage repo & ci
- `*/lib/`: code for specific topic

Most of the code should be self explainable by the naming,
  though there are some truly weird ones.  
And there's a few document files scattered in the source,
  along with many comments & TODOs,
  feel free to find & read them.
