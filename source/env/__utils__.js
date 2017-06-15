function getGlobal () {
  if (typeof (window) !== 'undefined') return window
  if (typeof (global) !== 'undefined') return global
  return this
}

function getEnvironment () {
  const GLOBAL = getGlobal()
  const isNode = (typeof (GLOBAL.process) !== 'undefined' && typeof (GLOBAL.process.versions) !== 'undefined' && GLOBAL.process.versions.node)
  const isBrowser = (typeof (GLOBAL.window) !== 'undefined' && typeof (GLOBAL.document) !== 'undefined')
  return {
    isNode,
    isBrowser,
    environmentName: isNode ? 'node'
      : isBrowser ? 'browser'
        : 'unknown'
  }
}

function getSystemEndianness () {
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

export {
  getGlobal,
  getEnvironment,
  getSystemEndianness
}
