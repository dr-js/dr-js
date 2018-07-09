const getGlobal = () => (typeof (window) !== 'undefined') ? window
  : (typeof (global) !== 'undefined') ? global
    : this

const getEnvironment = () => {
  const { process, window, document } = getGlobal()
  const isNode = (typeof (process) !== 'undefined' && typeof (process.versions) !== 'undefined' && process.versions.node)
  const isBrowser = (typeof (window) !== 'undefined' && typeof (document) !== 'undefined')
  const environmentName = isNode ? 'node'
    : isBrowser ? 'browser'
      : 'unknown'
  return { isNode, isBrowser, environmentName }
}

const GLOBAL = getGlobal()

export {
  getGlobal,
  getEnvironment,
  GLOBAL as global
}
