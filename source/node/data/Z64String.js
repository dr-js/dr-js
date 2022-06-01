import {
  gzipSync, gunzipSync,
  brotliCompressSync, brotliDecompressSync,
  constants
} from 'node:zlib'

// NOTE: here the "Z" in `Z64String` refers to nodejs 'zlib', not 'gzip'
// for tagging the pack method:
// - b64: base64
// - gz64: gzip+base64
// - br64: brotli+base64
// - jz64: json+gzip+base64
// - jb64: json+brotli+base64

const packB64 = (stringOrBuffer) => Buffer.from(stringOrBuffer).toString('base64')
const unpackB64 = (b64StringOrBuffer) => String(Buffer.from(b64StringOrBuffer, 'base64'))

const packGz64 = (stringOrBuffer) => gzipSync(Buffer.from(stringOrBuffer), { level: 9 }).toString('base64')
const unpackGz64 = (gz64StringOrBuffer) => String(gunzipSync(Buffer.from(gz64StringOrBuffer, 'base64')))

const packBr64 = (stringOrBuffer) => brotliCompressSync(Buffer.from(stringOrBuffer), {
  params: {
    [ constants.BROTLI_PARAM_MODE ]: constants.BROTLI_MODE_TEXT,
    [ constants.BROTLI_PARAM_QUALITY ]: 11,
    [ constants.BROTLI_PARAM_SIZE_HINT ]: Buffer.byteLength(stringOrBuffer)
  }
}).toString('base64')
const unpackBr64 = (br64StringOrBuffer) => String(brotliDecompressSync(Buffer.from(br64StringOrBuffer, 'base64')))

export {
  packB64, unpackB64,
  packGz64, unpackGz64,
  packBr64, unpackBr64
}
