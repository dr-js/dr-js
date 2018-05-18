const packBufferString = (arrayBuffer) => String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
const parseBufferString = (bufferString = '') => {
  const packTypedArray = new Uint8Array(bufferString.length)
  for (let index = 0, indexMax = bufferString.length; index < indexMax; index++) packTypedArray[ index ] = bufferString.charCodeAt(index)
  return packTypedArray.buffer
}

// TODO: maybe not safe for JSON or network transmission
// TODO: check why 57236 will become 65533 after send from Browser to Node wrapped by JSON
const PREFIX_ODD = Uint8Array.of(0, 0, 0)
const PREFIX_EVEN = Uint8Array.of(255, 255)
const packUint16String = (arrayBuffer) => {
  const prefixTypedArray = arrayBuffer.byteLength % 2 ? PREFIX_ODD : PREFIX_EVEN
  const packTypedArray = new Uint8Array(prefixTypedArray.byteLength + arrayBuffer.byteLength)
  packTypedArray.set(prefixTypedArray, 0)
  packTypedArray.set(new Uint8Array(arrayBuffer), prefixTypedArray.byteLength)
  return String.fromCharCode.apply(null, new Uint16Array(packTypedArray.buffer))
}
const parseUint16String = (uint16String = '') => {
  const packTypedArray = new Uint16Array(uint16String.length)
  for (let index = 0, indexMax = uint16String.length; index < indexMax; index++) packTypedArray[ index ] = uint16String.charCodeAt(index)
  return packTypedArray.buffer.slice(packTypedArray[ 0 ] === 0 ? 3 : 2)
}

const compareArrayBuffer = (a, b) => {
  if (a === b) return true
  if (a.byteLength !== b.byteLength) return false
  const va = new Uint8Array(a)
  const vb = new Uint8Array(b)
  for (let index = 0, indexMax = a.byteLength; index < indexMax; index++) if (va[ index ] !== vb[ index ]) return false
  return true
}

export {
  packBufferString,
  parseBufferString,

  packUint16String,
  parseUint16String,

  compareArrayBuffer
}
