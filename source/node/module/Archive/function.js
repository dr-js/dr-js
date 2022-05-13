import { createReadStream, createWriteStream, promises as fsAsync } from 'node:fs'
import { constants, createGzip, createGunzip, createBrotliCompress, createBrotliDecompress } from 'node:zlib'
import { quickRunletFromStream } from 'source/node/data/Stream.js'

const REGEXP_TGZ = /\.t(?:ar\.)?gz$/
const REGEXP_TBR = /\.t(?:ar\.)?br$/
const REGEXP_T7Z = /\.t(?:ar\.)?7z$/
const REGEXP_TXZ = /\.t(?:ar\.)?xz$/

// the `0x1f8b08` check for: containing a magic number (1f 8b), the compression method (08 for DEFLATE)
// https://en.wikipedia.org/wiki/Gzip
// https://github.com/kevva/is-gzip
// https://stackoverflow.com/questions/6059302/how-to-check-if-a-file-is-gzip-compressed
const isBufferGzip = (buffer) => (
  buffer && buffer.length > 3 &&
  buffer[ 0 ] === 0x1f &&
  buffer[ 1 ] === 0x8b &&
  buffer[ 2 ] === 0x08
)
const isFileGzip = async (file) => {
  const buffer = Buffer.allocUnsafe(3)
  await fsAsync.read(file, buffer, 0, 3, 0)
  return isBufferGzip(buffer)
}
const createGzipMax = () => createGzip({
  level: 9, windowBits: 15, memLevel: 9,
  chunkSize: 128 * 1024 // bigger chunk
})
const createBrotliCompressMax = () => createBrotliCompress({
  params: { [ constants.BROTLI_PARAM_QUALITY ]: 11 }, // TODO: NOTE: may be slow, or just use level 9? check: https://paulcalvano.com/2018-07-25-brotli-compression-how-much-will-it-reduce-your-content/
  chunkSize: 128 * 1024 // bigger chunk
})

const REGEXP_GZ = /\.t?gz$/
const REGEXP_BR = /\.t?br$/
const REGEXP_GZBR = /\.t?(?:gz|br)$/
const compressGzBrFileAsync = async (fileFrom, fileTo, isGzip = REGEXP_GZ.test(fileTo)) => quickRunletFromStream(
  createReadStream(fileFrom),
  isGzip ? createGzipMax() : createBrotliCompressMax(),
  createWriteStream(fileTo)
)
const extractGzBrFileAsync = async (fileFrom, fileTo, isGzip = REGEXP_GZ.test(fileFrom)) => quickRunletFromStream(
  createReadStream(fileFrom),
  isGzip ? createGunzip() : createBrotliDecompress(),
  createWriteStream(fileTo)
)

export {
  REGEXP_TGZ, REGEXP_TBR, REGEXP_T7Z, REGEXP_TXZ,
  isBufferGzip, isFileGzip, createGzipMax, createBrotliCompressMax,
  REGEXP_GZ, REGEXP_BR, REGEXP_GZBR,
  compressGzBrFileAsync, extractGzBrFileAsync
}
