// check: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
let globalCache
const getGlobal = () => globalCache !== undefined ? globalCache : (
  globalCache = (typeof (globalThis) !== 'undefined') ? globalThis // eslint-disable-line no-undef
    : (typeof (self) !== 'undefined') ? self // eslint-disable-line no-undef
      : (typeof (window) !== 'undefined') ? window
        : (typeof (global) !== 'undefined') ? global
          : this // whatever
)

let environmentCache
const getEnvironment = () => {
  if (environmentCache === undefined) {
    const { process, window, document } = getGlobal()
    const isNode = (typeof (process) !== 'undefined' && typeof (process.versions) !== 'undefined' && process.versions.node)
    const isBrowser = (typeof (window) !== 'undefined' && typeof (document) !== 'undefined')
    const environmentName = isNode ? 'node'
      : isBrowser ? 'browser'
        : 'unknown'
    environmentCache = { isNode, isBrowser, environmentName }
  }
  return environmentCache
}

const GLOBAL = getGlobal() // TODO: DEPRECATE: unnecessary side effect

export {
  getGlobal,
  getEnvironment,
  GLOBAL as global // TODO: DEPRECATE: unnecessary side effect
}
