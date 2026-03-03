# break log

keep list of notable break & big code change

- planned change in `0.6.0-pre`:
  - BREAK: downgrade/drop `win32`, `macos` support
  - BREAK: browser: target `chrome64 firefox78 safari14 edge79`
  - BREAK: node: require `nodejs@24.14`
  - BREAK: node: require `npm@11.9`
  - BREAK: build: code in `source/` is ES module with TSDoc, direct copy to `esm/` as output
    - no `babel` to `module/` and `library/`
    - no `webpack` to `Dr.browser.js`
  - BREAK: dev: use `esbuild` to replace `webpack`, `babel`, `terser` 
  - BREAK: dev: use `@typescript/native-preview` (`tsgo`) to replace `typescript` (`tsc`) for type-checking
  - BREAK: dev: use `@biomejs/biome` to replace `eslint` for linting
  - ADD: qjs-ng: target `quickjs-ng@0.12`
  - ADD: typing with TSDoc, add `jsconfig.json` & use `"checkJs": true, "strict": true`
  - ADD: inline code from `dr-dev`
    - consider also publish as `dr-js@24`, since there's no planned `@dr-js/dev-*` package
  - MOVE: re-order structure
  - DEL: non-necessary JS patch, or obsolete code
  - CHG: switch to npm trusted publishing (OIDC)

- `0.6.0-pre`
  - DEV-BREAK: node/server: default 500 for `responderEnd`, add `responderMissing` & default 404 to router
- `0.5.0`
  - break: use `node:*` for node core module
  - break: expect `nodejs@14.18`
  - deprecate: mass clean up
- `0.4.0`
  - deprecated: `forEachMap`, use `forEachOfSet` from `createSetMap`
  - deprecated: env: `global`, use `getGlobal` instead
  - break: better output of `calcCode` from `common/module/TimedLookup`, note this will break all previous auth check
  - break: node: use `LoggerExot` instead of `Logger` from `node/module/Logger`
  - break: node: use server `forceCloseTimeout` instead of `isForceClose` and later not changeable
  - break: node: set `exitCode` instead of direct `exit` in `node/system/ExitListener`
  - break: node: use `createFileWatcherExot` instead of `createFileWatcher`
  - break: node: move `getRandomBufferAsync` into `node/data/Buffer`
  - break: node: inline `createLogQueue` into `node/module/Logger`
  - break: node: use `createServerExot` instead of `createServerPack`
  - break: node: use `describeServerOption` instead of `describeServerPack`
  - break: browser: use `LocalStorageStateStore` instead of `StateStorage`
  - break: bin: use `commonServerUp` instead of `commonStartServer`
- `0.3.0` - placeholder
- `0.2.0` - placeholder
- `0.1.0` - placeholder
