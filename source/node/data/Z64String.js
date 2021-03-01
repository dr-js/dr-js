import {
  gzipSync, gunzipSync,
  brotliCompressSync, brotliDecompressSync,
  constants
} from 'zlib'

// NOTE: here the "Z" in `Z64String` refers to nodejs 'zlib', not 'gzip'
// for tagging the pack method:
// - jz64: json+gzip+base64
// - jb64: json+brotli+base64

const packGz64 = (string) => gzipSync(Buffer.from(string), { level: 9 }).toString('base64')
const unpackGz64 = (gz64String) => String(gunzipSync(Buffer.from(gz64String, 'base64')))

const packBr64 = (string) => brotliCompressSync(Buffer.from(string), {
  params: {
    [ constants.BROTLI_PARAM_MODE ]: constants.BROTLI_MODE_TEXT,
    [ constants.BROTLI_PARAM_QUALITY ]: 11,
    [ constants.BROTLI_PARAM_SIZE_HINT ]: Buffer.byteLength(string)
  }
}).toString('base64')
const unpackBr64 = (br64String) => String(brotliDecompressSync(Buffer.from(br64String, 'base64')))

export {
  packGz64, unpackGz64,
  packBr64, unpackBr64
}
