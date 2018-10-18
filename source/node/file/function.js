import { resolve as resolvePath, normalize, dirname, sep } from 'path'
import {
  stat, access, rename, unlink,
  readFile, writeFile, copyFile,
  mkdir, rmdir, readdir,
  createReadStream, createWriteStream,
  constants as fsConstants
} from 'fs'
import { promisify } from 'util'
import { createInterface } from 'readline'

const statAsync = promisify(stat)
const renameAsync = promisify(rename)
const unlinkAsync = promisify(unlink)
const accessAsync = promisify(access) // TODO: NOTE: will throw if not accessible
const visibleAsync = (path) => new Promise((resolve) => access(path, fsConstants.F_OK, (error) => resolve(!error)))
const readableAsync = (path) => new Promise((resolve) => access(path, fsConstants.R_OK, (error) => resolve(!error)))
const writableAsync = (path) => new Promise((resolve) => access(path, fsConstants.W_OK, (error) => resolve(!error)))
const executableAsync = (path) => new Promise((resolve) => access(path, fsConstants.X_OK, (error) => resolve(!error)))

const mkdirAsync = promisify(mkdir)
const rmdirAsync = promisify(rmdir)
const readdirAsync = promisify(readdir)

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)
const copyFileAsync = promisify(copyFile) // since 8.5.0

const nearestExistAsync = async (path) => {
  while (path && !await visibleAsync(path)) path = dirname(path)
  return path
}

const createPathPrefixLock = (rootPath) => {
  rootPath = resolvePath(rootPath)
  return (relativePath) => {
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
const toPosixPath = sep === '\\'
  ? (path) => path.replace(/\\/g, '/')
  : (path) => path

export {
  statAsync,
  renameAsync,
  unlinkAsync,
  accessAsync,
  visibleAsync,
  readableAsync,
  writableAsync,
  executableAsync,
  mkdirAsync,
  rmdirAsync,
  readdirAsync,
  readFileAsync,
  writeFileAsync,
  copyFileAsync,
  nearestExistAsync,

  createReadStream,
  createWriteStream,
  createPathPrefixLock,

  createReadlineFromStreamAsync,
  createReadlineFromFileAsync,

  trimPathDepth,
  toPosixPath
}
