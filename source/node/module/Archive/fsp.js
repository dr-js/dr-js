import { resolve } from 'path'
import { initFsPack, saveFsPack, loadFsPack, appendFromPath, unpackToPath } from 'source/node/module/FsPack.js'
import { REGEXP_GZBR, compressGzBrFileAsync, extractGzBrFileAsync, withTempPath } from './function.js'

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

const compressFspGzBrAsync = async (sourceDirectory, outputFile, pathTemp) => withTempPath(pathTemp, async (sourceDirectory, outputFile, pathTemp) => {
  await compressFspAsync(sourceDirectory, resolve(pathTemp, 'archive.fsp'))
  await compressGzBrFileAsync(resolve(pathTemp, 'archive.fsp'), outputFile)
}, sourceDirectory, outputFile)
const extractFspGzBrAsync = async (sourceFile, outputPath, pathTemp) => withTempPath(pathTemp, async (sourceFile, outputPath, pathTemp) => {
  await extractGzBrFileAsync(sourceFile, resolve(pathTemp, 'archive.fsp'))
  await extractFspAsync(resolve(pathTemp, 'archive.fsp'), outputPath)
}, sourceFile, outputPath)

// for `.fsp|.fsp.gz|.fsp.br`
const compressAsync = async (sourceDirectory, outputFile, pathTemp) => (REGEXP_GZBR.test(outputFile) ? compressFspGzBrAsync : compressFspAsync)(sourceDirectory, outputFile, pathTemp)
const extractAsync = async (sourceFile, outputPath, pathTemp) => (REGEXP_GZBR.test(sourceFile) ? extractFspGzBrAsync : extractFspAsync)(sourceFile, outputPath, pathTemp)

export { // TODO: move related to `module/Archive/`
  REGEXP_FSP,
  compressFspAsync, extractFspAsync,
  compressFspGzBrAsync, extractFspGzBrAsync,
  compressAsync, extractAsync // NOTE: will not auto create output path
}
