const getGlobal = () => {
  const GLOBAL = (typeof (window) !== 'undefined') ? window
    : (typeof (global) !== 'undefined') ? global
      : this

  // TODO: will cause webpack warning `Critical dependency: the request of a dependency is an expression`, but whatever
  GLOBAL.TRY_REQUIRE = (name = '') => {
    try {
      return require(name)
    } catch (error) { __DEV__ && console.log(`[TRY_REQUIRE] failed for ${name}`, error) }
  }

  return GLOBAL
}

const getEnvironment = () => {
  const { process, window, document } = getGlobal()
  const isNode = (typeof (process) !== 'undefined' && typeof (process.versions) !== 'undefined' && process.versions.node)
  const isBrowser = (typeof (window) !== 'undefined' && typeof (document) !== 'undefined')
  const environmentName = isNode ? 'node'
    : isBrowser ? 'browser'
      : 'unknown'
  return { isNode, isBrowser, environmentName }
}

const getEndianness = () => {
  try {
    const uint8Array = new Uint8Array(new ArrayBuffer(2))
    const uint16array = new Uint16Array(uint8Array.buffer)
    uint8Array[ 0 ] = 0xa1 // set first byte
    uint8Array[ 1 ] = 0xb2 // set second byte
    if (uint16array[ 0 ] === 0xb2a1) return 'little'
    if (uint16array[ 0 ] === 0xa1b2) return 'big'
  } catch (error) { console.error('[getEndianness]', error) }
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
  getEndianness,
  assert,
  GLOBAL as global
}
