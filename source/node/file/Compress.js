import { createGzip } from 'zlib'
import { createReadStream, createWriteStream, statAsync, unlinkAsync, readableAsync } from './function'

const compressFile = (
  inputFile,
  outputFile,
  compressStream = createGzip()
) => new Promise((resolve, reject) => {
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

const compressFileList = async ({
  fileList,
  fileSuffix = '.gz',
  createCompressStream = createGzip,
  deleteBloat = false,
  bloatRatio = 1 // expect value >= 1, like 1.10
}) => {
  for (const filePath of fileList) {
    if (filePath.endsWith(fileSuffix)) continue
    __DEV__ && console.log('[compressFileList]', filePath)
    const compressFilePath = `${filePath}${fileSuffix}`
    await readableAsync(compressFilePath) || await compressFile(filePath, compressFilePath, createCompressStream())
    deleteBloat && await checkBloat(filePath, compressFilePath, bloatRatio) && await unlinkAsync(compressFilePath)
  }
}

const checkBloat = async (inputFile, outputFile, bloatRatio) => {
  const { size: inputSize } = await statAsync(inputFile)
  const { size: outputSize } = await statAsync(outputFile)
  return (outputSize * bloatRatio) >= inputSize
}

export {
  compressFile,
  compressFileList,
  checkBloat
}
