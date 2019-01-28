import { resolve as resolvePath, normalize, dirname, sep } from 'path'
import {
  stat, open, rename, unlink, truncate,
  readFile, writeFile, appendFile, copyFile, // since 8.5.0
  mkdir, rmdir, readdir,
  createReadStream, createWriteStream,
  access,
  constants as fsConstants
} from 'fs'
import { promisify } from 'util'
import { createInterface } from 'readline'

const [
  statAsync, openAsync, renameAsync, unlinkAsync, truncateAsync,
  readFileAsync, writeFileAsync, appendFileAsync, copyFileAsync,
  mkdirAsync, rmdirAsync, readdirAsync
] = [
  stat, open, rename, unlink, truncate,
  readFile, writeFile, appendFile, copyFile,
  mkdir, rmdir, readdir
].map((fsFunc) => promisify(fsFunc))

const [
  visibleAsync,
  readableAsync,
  writableAsync,
  executableAsync
] = [
  fsConstants.F_OK,
  fsConstants.R_OK,
  fsConstants.W_OK,
  fsConstants.X_OK
].map((mode) => (path) => new Promise((resolve) => access(path, mode, (error) => resolve(!error))))

const nearestExistAsync = async (path) => {
  while (path && !await visibleAsync(path)) path = dirname(path)
  return path
}

const createPathPrefixLock = (rootPath) => {
  rootPath = resolvePath(rootPath)
  return (relativePath) => { // TODO: may silently drop path, should add fool-proof error/check
    const absolutePath = resolvePath(rootPath, relativePath)
    if (!absolutePath.startsWith(rootPath)) throw new Error(`[PathPrefixLock] invalid relativePath: ${relativePath}`)
    return absolutePath
  }
}

// TODO: not able to pause & resume the line-reading to run some async code
const createReadlineFromStreamAsync = (readStream, onLineSync) => new Promise((resolve, reject) => {
  const readlineInterface = createInterface({ input: readStream, historySize: 0, crlfDelay: Infinity })
  readlineInterface.on('error', (error) => { // TODO: this is not documented, don't know if this will be called or not
    __DEV__ && console.log(`[Readline] error`, error)
    readlineInterface.close()
    reject(error)
  })
  readlineInterface.on('close', () => {
    __DEV__ && console.log(`[Readline] close`)
    resolve()
  })
  readlineInterface.on('line', (line) => {
    __DEV__ && console.log(`[Readline] line: ${line}`)
    onLineSync(line)
  })
})
const createReadlineFromFileAsync = (filePath, onLineSync) => createReadlineFromStreamAsync(createReadStream(filePath), onLineSync)

const trimPathDepth = (path, depth) => normalize(path).split(sep).slice(0, depth).join(sep)

const REGEXP_PATH_SEP_WIN32 = /\\/g
const toPosixPath = (path) => path.replace(REGEXP_PATH_SEP_WIN32, '/')

export {
  createReadStream, createWriteStream,

  statAsync, openAsync, renameAsync, unlinkAsync, truncateAsync,
  readFileAsync, writeFileAsync, appendFileAsync, copyFileAsync,
  mkdirAsync, rmdirAsync, readdirAsync,

  visibleAsync, readableAsync, writableAsync, executableAsync,

  nearestExistAsync,

  createPathPrefixLock,

  createReadlineFromStreamAsync,
  createReadlineFromFileAsync,

  trimPathDepth,
  toPosixPath
}
