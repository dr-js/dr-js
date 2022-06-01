import { resolve } from 'node:path'
import { withTempDirectory } from 'source/node/fs/Directory.js'
import { initFsPack, saveFsPack, loadFsPack, appendFromPath, unpackToPath } from 'source/node/module/FsPack.js'
import { REGEXP_GZBR, compressGzBrFileAsync, extractGzBrFileAsync } from './function.js'

const REGEXP_FSP = /\.(?:fsp|fsp\.gz|fsp\.br)$/

const compressFspAsync = async (sourceDirectory, outputFile) => { // NOTE: not technically compress, but rather packing up
  const fsPack = await initFsPack({ packPath: outputFile, packRoot: sourceDirectory })
  await appendFromPath(fsPack, sourceDirectory)
  await saveFsPack(fsPack)
}
const extractFspAsync = async (sourceFile, outputPath) => {
  const fsPack = await loadFsPack({ packPath: sourceFile })
  await unpackToPath(fsPack, outputPath)
}

const compressFspGzBrAsync = async (sourceDirectory, outputFile, pathTemp) => withTempDirectory(async (pathTemp) => {
  await compressFspAsync(sourceDirectory, resolve(pathTemp, 'archive.fsp'))
  await compressGzBrFileAsync(resolve(pathTemp, 'archive.fsp'), outputFile)
}, pathTemp)
const extractFspGzBrAsync = async (sourceFile, outputPath, pathTemp) => withTempDirectory(async (pathTemp) => {
  await extractGzBrFileAsync(sourceFile, resolve(pathTemp, 'archive.fsp'))
  await extractFspAsync(resolve(pathTemp, 'archive.fsp'), outputPath)
}, pathTemp)

// for `.fsp|.fsp.gz|.fsp.br`
const compressAsync = async (sourceDirectory, outputFile, pathTemp) => (REGEXP_GZBR.test(outputFile) ? compressFspGzBrAsync : compressFspAsync)(sourceDirectory, outputFile, pathTemp)
const extractAsync = async (sourceFile, outputPath, pathTemp) => (REGEXP_GZBR.test(sourceFile) ? extractFspGzBrAsync : extractFspAsync)(sourceFile, outputPath, pathTemp)

export {
  REGEXP_FSP,
  compressFspAsync, extractFspAsync,
  compressFspGzBrAsync, extractFspGzBrAsync,
  compressAsync, extractAsync // NOTE: will not auto create output path
}
