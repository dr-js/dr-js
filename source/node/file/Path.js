import { Stats } from 'fs'
import { resolve, dirname } from 'path'
import { statAsync, renameAsync, unlinkAsync, copyFileAsync, mkdirAsync, rmdirAsync, visibleAsync } from './function'

// TODO: no symlink support, currently will follow link to target File/Directory

const STAT_ERROR = new Stats(
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

const PATH_TYPE = {
  File: 'File',
  Directory: 'Directory',
  Other: 'Other', // maybe device, socket or else
  Error: 'Error' // non exist
}

const onStatError = (error) => {
  __DEV__ && console.log('[getPathStat] error', error)
  return STAT_ERROR
}

const getPathStat = (path) => statAsync(path).catch(onStatError)

const getPathTypeFromStat = (stat) => stat.isDirectory() ? PATH_TYPE.Directory
  : stat.isFile() ? PATH_TYPE.File
    : stat !== STAT_ERROR ? PATH_TYPE.Other
      : PATH_TYPE.Error

// NOT recursive operation
const copyPath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat.isDirectory() && (await getPathStat(pathTo)).isDirectory()) return __DEV__ && console.log('[copyPath] both directory exist, skipped')
  return pathStat.isDirectory()
    ? mkdirAsync(pathTo)
    : copyFileAsync(pathFrom, pathTo)
}

const renamePath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat === STAT_ERROR) throw new Error(`missing path from ${pathFrom}`)
  return renameAsync(pathFrom, pathTo)
}

const deletePath = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path)
  return pathStat.isDirectory()
    ? rmdirAsync(path)
    : unlinkAsync(path)
}

const nearestExistPath = async (path) => { // TODO: NOTE: may be file or directory
  while (path && !await visibleAsync(path)) path = dirname(path)
  return path
}

const toPosixPath = (path) => path.replace(REGEXP_PATH_SEP_WIN32, '/')
const REGEXP_PATH_SEP_WIN32 = /\\/g

const createPathPrefixLock = (rootPath) => {
  rootPath = resolve(rootPath)
  return (relativePath) => { // TODO: may silently drop path, should add fool-proof error/check
    const absolutePath = resolve(rootPath, relativePath)
    if (!absolutePath.startsWith(rootPath)) throw new Error(`invalid relativePath: ${relativePath}`)
    return absolutePath
  }
}

export {
  STAT_ERROR,
  PATH_TYPE,

  getPathStat,
  getPathTypeFromStat,

  copyPath,
  renamePath,
  deletePath,
  nearestExistPath,

  toPosixPath,
  createPathPrefixLock
}
