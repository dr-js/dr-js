import { createGzip } from 'zlib'
import { statAsync, unlinkAsync, readableAsync, createReadStream, createWriteStream } from './__utils__'
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

const compressPath = async ({ path, deleteBloat = false, bloatRatio = 1 }) => {
  const fileList = await getFileList(path)
  for (const filePath of fileList) {
    if (filePath.endsWith('.gz')) continue
    __DEV__ && console.log('[compressPath]', filePath)
    const gzFilePath = `${filePath}.gz`
    await readableAsync(gzFilePath) || await compressFile(filePath, gzFilePath)
    deleteBloat && await checkBloat(filePath, gzFilePath, bloatRatio) && await unlinkAsync(gzFilePath)
  }
}

const checkBloat = async (inputFile, outputFile, bloatRatio) => {
  const { size: inputSize } = await statAsync(inputFile)
  const { size: outputSize } = await statAsync(outputFile)
  return (outputSize * bloatRatio) >= inputSize
}

export {
  compressFile,
  compressPath,
  checkBloat
}
