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

export {
  getEndianness,
  assert
}
