const getGlobal = () => (typeof (window) !== 'undefined') ? window
  : (typeof (global) !== 'undefined') ? global
    : this

const getEnvironment = () => {
  const { process, window, document } = getGlobal()
  const isNode = (typeof (process) !== 'undefined' && typeof (process.versions) !== 'undefined' && process.versions.node)
  const isBrowser = (typeof (window) !== 'undefined' && typeof (document) !== 'undefined')
  return {
    isNode,
    isBrowser,
    environmentName: isNode ? 'node'
      : isBrowser ? 'browser'
        : 'unknown'
  }
}

const getSystemEndianness = () => {
  try {
    const buffer = new ArrayBuffer(4)
    const viewUint8 = new Uint8Array(buffer)
    const viewUint32 = new Uint32Array(buffer)
    viewUint8[ 0 ] = 0xa1
    viewUint8[ 1 ] = 0xb2
    viewUint8[ 2 ] = 0xc3
    viewUint8[ 3 ] = 0xd4
    if (viewUint32[ 0 ] === 0xd4c3b2a1) return 'little'
    if (viewUint32[ 0 ] === 0xa1b2c3d4) return 'big'
  } catch (error) { console.error('[getSystemEndianness]', error) }
  return 'unknown'
}

const getConsoleMethod = (name) => console[ name ].bind ? console[ name ].bind(console)
  : console[ name ].apply ? (...args) => console[ name ].apply(console, args)
    : (...args) => console[ name ](args)

const GLOBAL = getGlobal()
const { isNode, isBrowser, environmentName } = getEnvironment()
const systemEndianness = getSystemEndianness()

const log = getConsoleMethod('log')
const warn = getConsoleMethod('warn')
const error = getConsoleMethod('error')
const assert = (assertion, ...args) => {
  if (assertion) return
  error('[ASSERT]', ...args)
  throw new Error(`[ASSERT] ${args.join(', ')}`) // guaranteed Error throw (console.assert in Browser do not throw)
}

export {
  getGlobal,
  getEnvironment,
  getSystemEndianness,
  getConsoleMethod,

  GLOBAL as global,
  isNode,
  isBrowser,
  environmentName,
  systemEndianness,

  log,
  warn,
  error,
  assert
}
