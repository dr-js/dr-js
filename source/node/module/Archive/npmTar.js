import { resolve } from 'path'
import { createBrotliCompress, createBrotliDecompress } from 'zlib'
import { createReadStream, createWriteStream, promises as fsAsync } from 'fs'
import { tryRequire } from 'source/env/tryRequire.js'
import { quickRunletFromStream } from 'source/node/data/Stream.js'
import { fromNpmNodeModules } from 'source/node/module/Software/npm.js'
import { REGEXP_TGZ, REGEXP_TBR } from './function.js'

const REGEXP_NPM_TAR = /\.(?:tar|tgz|tar\.gz|tbr|tar\.br)$/

let cacheNpmTar
const getNpmTar = () => {
  if (cacheNpmTar === undefined) cacheNpmTar = tryRequire(fromNpmNodeModules('tar')) || null // check doc from: https://npm.im/tar
  return cacheNpmTar
}
const check = () => Boolean(getNpmTar())
const verify = () => {
  const npmTar = getNpmTar()
  if (!npmTar) throw new Error('expect "npm/node_modules/tar"')
  return npmTar
}

// TODO: NOTE: there'll be an empty `.` folder in the output tar for the default nameList, but will disappear after extract, replacing the file list to the output of readdirSync may solve this
const createCompressStream = (sourceDirectory, option = { gzip: true }, nameList = [ './' ]) => {
  sourceDirectory = resolve(sourceDirectory)
  nameList.forEach((name, index) => name.startsWith('@') && (nameList[ index ] = `./${name}`)) // fix leading @ special case, check: https://www.npmjs.com/package/tar#tarcoptions-filelist-callback-alias-tarcreate
  return getNpmTar().create({ cwd: sourceDirectory, ...option }, nameList)
}
const createExtractStream = (outputPath, option) => {
  outputPath = resolve(outputPath)
  return getNpmTar().extract({ cwd: outputPath, ...option }) // will auto gunzip
}

// for `.tar|.tgz|.tar.gz|.tbr|.tar.br`
const compressAsync = async (sourceDirectory, outputFile) => quickRunletFromStream.apply(null, [
  createCompressStream(sourceDirectory, { gzip: REGEXP_TGZ.test(outputFile) }, await fsAsync.readdir(sourceDirectory)),
  REGEXP_TBR.test(outputFile) && createBrotliCompress(),
  createWriteStream(resolve(outputFile))
].filter(Boolean))
const extractAsync = async (sourceFile, outputPath) => quickRunletFromStream.apply(null, [
  createReadStream(resolve(sourceFile)),
  REGEXP_TBR.test(sourceFile) && createBrotliDecompress(),
  createExtractStream(outputPath)
].filter(Boolean))

const REGEXP_PACKAGE_JSON = /^[^/]+\/package\.json$/
const extractPackageJSON = async (sourceFile) => { // https://github.com/npm/node-tar/issues/181#issuecomment-492756116
  const chunkList = []
  await getNpmTar().list({
    file: sourceFile,
    onentry: (entry) => { REGEXP_PACKAGE_JSON.test(entry.path) && entry.on('data', (chunk) => chunkList.push(chunk)) }
  })
  if (!chunkList.length) throw new Error(`expect "${REGEXP_PACKAGE_JSON}" in ".tgz"`)
  return JSON.parse(String(Buffer.concat(chunkList)))
}

export {
  REGEXP_NPM_TAR, getNpmTar, check, verify,
  createCompressStream, createExtractStream,
  compressAsync, extractAsync, // NOTE: will not auto create output path
  extractPackageJSON
}
