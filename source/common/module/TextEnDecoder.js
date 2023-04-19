// https://developer.mozilla.org/docs/Web/API/TextEncoder
// should exist in Chrome@38, Edge@79, Safari@10.1, Firefox@20 and nodejs@12, not IE
const tryTextEnDecoder = () => {
  try { // browser & node
    const { TextEncoder, TextDecoder } = globalThis
    const expect = '🎉'
    const u8List = new TextEncoder().encode(expect)
    const actual = new TextDecoder().decode(u8List)
    if (expect === actual) return [ TextEncoder, TextDecoder ]
  } catch (error) { __DEV__ && console.log('[tryTextEnDecoder] browser/node', error) }

  return [ () => {}, () => {} ] // no fallback, will error on 'new TextEncoder'
}

const [ _TextEncoder, _TextDecoder ] = tryTextEnDecoder() // TODO: DEPRECATED: direct use

/** @type { (v: string) => Uint8Array } */
const encodeUTF8 = (string) => new TextEncoder().encode(string)
/** @type { (v: ArrayBuffer | Uint8Array | DataView) => string } */
const decodeUTF8 = (buffer) => new TextDecoder().decode(buffer)

/** @deprecated */ const __TextEncoder = _TextEncoder
/** @deprecated */ const __TextDecoder = _TextDecoder

export {
  encodeUTF8, decodeUTF8,

  __TextEncoder as TextEncoder, // TODO: DEPRECATED
  __TextDecoder as TextDecoder // TODO: DEPRECATED
}
