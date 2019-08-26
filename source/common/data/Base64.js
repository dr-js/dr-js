// only support conversion between `String` and `ArrayBuffer`
// string without padding `=` is not valid Base64, so no support here
// reference code:
//   - https://github.com/beatgammit/base64-js
//   - https://github.com/niklasvh/base64-arraybuffer

const B64_CHAR = []
const B64_CODE = []
{ // init fast lookup map
  const B64_CHAR_STRING = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (let index = 0, indexMax = B64_CHAR_STRING.length; index < indexMax; ++index) {
    B64_CHAR[ index ] = B64_CHAR_STRING.charAt(index)
    B64_CODE[ B64_CHAR_STRING.charCodeAt(index) ] = index
  }
  B64_CODE[ __DEV__ ? '-'.charCodeAt(0) : 45 ] = 62 // for URL-safe-Base64
  B64_CODE[ __DEV__ ? '_'.charCodeAt(0) : 95 ] = 63 // for URL-safe-Base64
}

const CHUNK_SIZE = 3 * 4 * 1024 // use chunk to compress array to string early, to save memory
const encodeU24Chunk = (u8List, index, indexMax) => {
  const stringList = []
  for (; index < indexMax; index += 3) {
    const u24 = (
      (u8List[ index ] << 16) + // (u8List[ index + 0 ] << 16) +
      (u8List[ index + 1 ] << 8) +
      (u8List[ index + 2 ]) // (u8List[ index + 2 ] << 0)
    )
    stringList.push(
      B64_CHAR[ (u24 >> 18) & 0b111111 ] +
      B64_CHAR[ (u24 >> 12) & 0b111111 ] +
      B64_CHAR[ (u24 >> 6) & 0b111111 ] +
      B64_CHAR[ u24 & 0b111111 ] // B64_CHAR[ (u24 >> 0) & 0b111111 ]
    )
  }
  return stringList.join('')
}

const encode = (arrayBuffer = new ArrayBuffer(0)) => {
  const u8List = new Uint8Array(arrayBuffer)
  const u8Count = u8List.length
  const u8TailCount = u8Count % 3
  const stringList = []
  for (let index = 0, indexMax = u8Count - u8TailCount; index < indexMax; index += CHUNK_SIZE) {
    stringList.push(encodeU24Chunk(u8List, index, Math.min(indexMax, index + CHUNK_SIZE)))
  }
  if (u8TailCount === 1) {
    const u8 = u8List[ u8Count - 1 ]
    stringList.push(
      B64_CHAR[ (u8 >> 2) & 0b111111 ] +
      B64_CHAR[ (u8 << 4) & 0b110000 ] +
      '=' +
      '='
    )
  } else if (u8TailCount === 2) {
    const u16 = (u8List[ u8Count - 2 ] << 8) + u8List[ u8Count - 1 ]
    stringList.push(
      B64_CHAR[ (u16 >> 10) & 0b111111 ] +
      B64_CHAR[ (u16 >> 4) & 0b111111 ] +
      B64_CHAR[ (u16 << 2) & 0b111100 ] +
      '='
    )
  }
  return stringList.join('')
}

const decode = (b64String = '') => {
  const padIndex = b64String.indexOf('=') // support joined b64String by keep only the first
  const u6Count = padIndex === -1 ? b64String.length : padIndex
  if (u6Count % 4 === 1) throw new Error('invalid Base64 string u6Count') // `u6Count` must be `4n + 0|2|3`
  const u6TailCount = u6Count % 4
  const u8Count = Math.floor(u6Count / 4) * 3 + (u6TailCount && (u6TailCount === 2 ? 1 : 2))
  const u8List = new Uint8Array(u8Count)
  for (let index = 0, indexMax = u6Count - u6TailCount, u8Index = 0; index < indexMax; index += 4, u8Index += 3) {
    const u24 =
      (B64_CODE[ b64String.charCodeAt(index) ] << 18) | // (B64_CODE[ b64String.charCodeAt(index + 0) ] << 18) |
      (B64_CODE[ b64String.charCodeAt(index + 1) ] << 12) |
      (B64_CODE[ b64String.charCodeAt(index + 2) ] << 6) |
      (B64_CODE[ b64String.charCodeAt(index + 3) ]) // (B64_CODE[ b64String.charCodeAt(index + 3) ] << 0)
    u8List[ u8Index ] = (u24 >> 16) & 0xff // u8List[ u8Index + 0 ] = (u24 >> 16) & 0xff
    u8List[ u8Index + 1 ] = (u24 >> 8) & 0xff
    u8List[ u8Index + 2 ] = u24 & 0xff // u8List[ u8Index + 2 ] = (u24 >> 0) & 0xff
  }
  if (u6TailCount === 2) {
    const u8 =
      (B64_CODE[ b64String.charCodeAt(u6Count - 2) ] << 2) |
      (B64_CODE[ b64String.charCodeAt(u6Count - 1) ] >> 4)
    u8List[ u8Count - 1 ] = u8 & 0xff
  } else if (u6TailCount === 3) {
    const u16 =
      (B64_CODE[ b64String.charCodeAt(u6Count - 3) ] << 10) |
      (B64_CODE[ b64String.charCodeAt(u6Count - 2) ] << 4) |
      (B64_CODE[ b64String.charCodeAt(u6Count - 1) ] >> 2)
    u8List[ u8Count - 2 ] = (u16 >> 8) & 0xff
    u8List[ u8Count - 1 ] = u16 & 0xff // u8List[ u8Count - 1 ] = (u16 >> 0) & 0xff
  }
  return u8List.buffer
}

export {
  encode,
  decode
}
