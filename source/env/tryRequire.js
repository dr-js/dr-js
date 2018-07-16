import { global } from './global'

// TODO: will cause webpack warning `Critical dependency: the request of a dependency is an expression`, but whatever
// TODO: put in separate folder here so webpack will not assume whole package is required
// check: https://github.com/webpack/webpack/issues/196
// check: https://github.com/sindresorhus/got/commit/a4ce0a738b25a02c2b6b50a4a52e94e5974f2f8b
// - - If the module source contains a require that cannot be statically analyzed, the context is the current directory.
// - - In this case a Critical dependencies warning is emitted.

const getTryRequire = () => {
  const REQUIRE = (global.module && global.module.require) ||
    (module && module.require) ||
    global.require // do not use local context require directly
  return (name = '') => {
    try {
      return REQUIRE(name)
    } catch (error) { __DEV__ && console.log(`[tryRequire] failed for ${name}`, error) }
  }
}

const tryRequire = getTryRequire()

export { tryRequire }
