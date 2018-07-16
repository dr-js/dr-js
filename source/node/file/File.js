import { Stats } from 'fs'
import { dirname } from 'path'
import {
  lstatAsync,
  mkdirAsync,
  rmdirAsync,
  renameAsync,
  unlinkAsync,
  copyFileAsync
} from './function'

const ERROR_STAT = new Stats(
  -1, // dev
  -1, // mode
  0, // nlink
  -1, // uid
  -1, // gid
  -1, // rdev
  0, // blksize
  0, // ino
  0, // size
  0, // blocks
  0, // atim_msec
  0, // mtim_msec
  0, // ctim_msec
  0 // birthtim_msec
)

const FILE_TYPE = {
  File: 'File',
  Directory: 'Directory',
  SymbolicLink: 'SymbolicLink',
  Other: 'Other', // maybe device, socket or else
  Error: 'Error' // non exist
}

const pathStatError = (error) => {
  __DEV__ && console.log('[pathStatError]', error)
  return ERROR_STAT
}

const getPathStat = (path) => lstatAsync(path).catch(pathStatError)

const getPathTypeFromStat = (stat) => stat.isDirectory() ? FILE_TYPE.Directory
  : stat.isFile() ? FILE_TYPE.File
    : stat.isSymbolicLink() ? FILE_TYPE.SymbolicLink
      : stat !== ERROR_STAT ? FILE_TYPE.Other
        : FILE_TYPE.Error

const createDirectory = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path)
  if (pathStat.isDirectory()) return // directory exist, pass
  if (pathStat !== ERROR_STAT) throw new Error('[createDirectory] path already taken by non-directory')

  // check up
  const upperPath = dirname(path)
  const upperPathStat = await getPathStat(upperPath)
  !upperPathStat.isDirectory() && await createDirectory(upperPath, upperPathStat)

  // create directory
  await mkdirAsync(path)
}

// NOT recursive operation
const movePath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat === ERROR_STAT) throw new Error(`[movePath] missing path from ${pathFrom}`)
  return renameAsync(pathFrom, pathTo)
}
const copyPath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat.isDirectory() && (await getPathStat(pathTo)).isDirectory()) return __DEV__ && console.log('[copyPath] both directory exist, skipped')
  return pathStat.isDirectory()
    ? mkdirAsync(pathTo)
    : copyFileAsync(pathFrom, pathTo)
}
const deletePath = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path)
  return pathStat.isDirectory()
    ? rmdirAsync(path)
    : unlinkAsync(path)
}

export {
  ERROR_STAT,
  FILE_TYPE,

  getPathStat,
  getPathTypeFromStat,

  createDirectory,

  movePath,
  copyPath,
  deletePath
}
