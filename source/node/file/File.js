import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { promisify } from 'util'

const FILE_TYPE = {
  File: 'File',
  Directory: 'Directory',
  SymbolicLink: 'SymbolicLink',
  Other: 'Other',
  Error: 'Error'
}

const lstat = promisify(nodeModuleFs.lstat)
const fstat = promisify(nodeModuleFs.fstat)
const mkdir = promisify(nodeModuleFs.mkdir)
const rmdir = promisify(nodeModuleFs.rmdir)
const open = promisify(nodeModuleFs.open)
const rename = promisify(nodeModuleFs.rename)
const unlink = promisify(nodeModuleFs.unlink)

const getPathTypeFromStat = (stat) => stat.isDirectory() ? FILE_TYPE.Directory
  : stat.isFile() ? FILE_TYPE.File
    : stat.isSymbolicLink() ? FILE_TYPE.SymbolicLink
      : FILE_TYPE.Other

const pathTypeError = () => FILE_TYPE.Error

const getPathType = (path) => lstat(path).then(getPathTypeFromStat, pathTypeError)

const copyFile = async (pathFrom, pathTo) => {
  const fdFrom = await open(pathFrom, 'r')
  const stat = await fstat(fdFrom)
  const fdTo = await open(pathTo, 'w', stat.mode)

  const readStream = nodeModuleFs.createReadStream(undefined, { fd: fdFrom })
  const writeStream = nodeModuleFs.createWriteStream(undefined, { fd: fdTo, mode: stat.mode })
  await new Promise((resolve, reject) => {
    readStream.on('error', reject)
    writeStream.on('error', reject)
    writeStream.on('close', resolve)
    readStream.pipe(writeStream)
  })
}

const createDirectory = async (path, pathType) => {
  if (pathType === undefined) pathType = await getPathType(path)
  if (pathType === FILE_TYPE.Directory) return // directory exist, pass
  if (pathType !== FILE_TYPE.Error) throw new Error('[createDirectory] path already taken by non-directory')

  // check up
  const upperPath = nodeModulePath.dirname(path)
  const upperPathType = await getPathType(upperPath)
  if (upperPathType !== FILE_TYPE.Directory) await createDirectory(upperPath, upperPathType)

  // create directory
  if (pathType !== FILE_TYPE.Directory) await mkdir(path)
}

// NOT recursive operation
const copyPath = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  if (await getPathType(pathTo) === pathType && pathType === FILE_TYPE.Directory) {
    __DEV__ && console.log('[copyPath] directory exist, skipped')
    return
  }
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return copyFile(pathFrom, pathTo)
    case FILE_TYPE.Directory:
      return mkdir(pathTo)
  }
  throw new Error(`[copyPath] error pathType ${pathType} for ${pathFrom}`)
}
const movePath = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
    case FILE_TYPE.Directory:
      return rename(pathFrom, pathTo)
  }
  throw new Error(`[movePath] error pathType ${pathType} for ${pathFrom}`)
}
const deletePath = async (path, pathType) => {
  if (pathType === undefined) pathType = await getPathType(path)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return unlink(path)
    case FILE_TYPE.Directory:
      return rmdir(path)
  }
  throw new Error(`[deletePath] error pathType ${pathType} for ${path}`)
}

export {
  FILE_TYPE,

  getPathType,
  createDirectory,
  copyFile,

  deletePath,
  movePath,
  copyPath
}
