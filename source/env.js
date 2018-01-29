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

const assert = (assertion, ...args) => { // always Error throw (console.assert in Browser do not throw)
  if (assertion) return
  console.error('[ASSERT]', ...args)
  throw new Error(`[ASSERT] ${args.join(', ')}`)
}

const GLOBAL = getGlobal()

export {
  getGlobal,
  getEnvironment,
  getSystemEndianness,
  assert,
  GLOBAL as global
}
