import { createGzip } from 'zlib'
import { statAsync, unlinkAsync, createReadStream, createWriteStream } from './__utils__'
import { getFileList } from './Modify'

const compressFile = (inputFile, outputFile, compressStream = createGzip()) => new Promise((resolve, reject) => {
  const readStream = createReadStream(inputFile)
  const writeStream = createWriteStream(outputFile)
  const onError = (error) => {
    readStream.destroy()
    writeStream.destroy()
    reject(error)
  }
  readStream.on('error', onError)
  writeStream.on('error', onError)
  writeStream.on('finish', resolve)
  readStream.pipe(compressStream).pipe(writeStream)
})

const compressPath = async ({ path, deleteBloat, bloatRatio = 1 }) => {
  const fileList = await getFileList(path)
  for (const filePath of fileList) {
    if (filePath.endsWith('.gz')) continue
    __DEV__ && console.log('[compressPath]', filePath)
    const compressPath = `${filePath}.gz`
    await compressFile(filePath, compressPath)
    if (deleteBloat && await checkBloat(filePath, compressPath, bloatRatio)) await unlinkAsync(compressPath)
  }
}

const checkBloat = async (inputFile, outputFile, bloatRatio) => {
  const { size: inputSize } = await statAsync(inputFile)
  const { size: outputSize } = await statAsync(outputFile)
  return (outputSize / inputSize) < bloatRatio
}

export {
  compressFile,
  compressPath,
  checkBloat
}
