import {
  lstatSync, statSync,
  symlinkSync, readlinkSync,
  renameSync, unlinkSync, accessSync,
  mkdirSync, rmdirSync, copyFileSync,
  Stats, promises as fsAsync
} from 'fs'
import { join, resolve, dirname, sep } from 'path'
import { homedir } from 'os'

import { withFallbackResult, withFallbackResultAsync } from 'source/common/error.js'

// NOTE: default will not follow symlink, and some symlink may form a loop

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
  Symlink: 'Symlink',
  Other: 'Other', // maybe device, socket or else
  Error: 'Error' // non exist
}

const getPathTypeFromStat = (stat) => stat.isSymbolicLink() ? PATH_TYPE.Symlink
  : stat.isDirectory() ? PATH_TYPE.Directory
    : stat.isFile() ? PATH_TYPE.File
      : stat === STAT_ERROR ? PATH_TYPE.Error
        : PATH_TYPE.Other

const getPathLstat = async (path) => withFallbackResultAsync(STAT_ERROR, fsAsync.lstat, path)
const getPathLstatSync = (path) => withFallbackResult(STAT_ERROR, lstatSync, path)
const getPathStat = async (path) => withFallbackResultAsync(STAT_ERROR, fsAsync.stat, path)
const getPathStatSync = (path) => withFallbackResult(STAT_ERROR, statSync, path)

// NOT recursive operation
const copyPath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(pathFrom)
  return pathStat.isSymbolicLink() ? fsAsync.symlink(await fsAsync.readlink(pathFrom), pathTo) // resolve to nothing
    : pathStat.isDirectory() ? ((await getPathLstat(pathTo)).isDirectory() ? undefined : fsAsync.mkdir(pathTo)) // resolve to nothing
      : fsAsync.copyFile(pathFrom, pathTo) // resolve to nothing
}
const copyPathSync = (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = getPathLstatSync(pathFrom)
  return pathStat.isSymbolicLink() ? symlinkSync(readlinkSync(pathFrom), pathTo) // resolve to nothing
    : pathStat.isDirectory() ? ((getPathLstatSync(pathTo)).isDirectory() ? undefined : mkdirSync(pathTo)) // resolve to nothing
      : copyFileSync(pathFrom, pathTo) // resolve to nothing
}

const renamePath = async (pathFrom, pathTo) => fsAsync.rename(pathFrom, pathTo) // resolve to nothing
const renamePathSync = (pathFrom, pathTo) => renameSync(pathFrom, pathTo) // resolve to nothing

const deletePath = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(path)
  pathStat.isDirectory()
    ? await fsAsync.rmdir(path) // resolve to nothing
    : await fsAsync.unlink(path) // resolve to nothing
}
const deletePathSync = (path, pathStat) => {
  if (pathStat === undefined) pathStat = getPathLstatSync(path)
  pathStat.isDirectory()
    ? rmdirSync(path) // resolve to nothing
    : unlinkSync(path) // resolve to nothing
}
const deletePathForce = async (path, pathStat) => withFallbackResultAsync(undefined, deletePath, path, pathStat)
const deletePathForceSync = (path, pathStat) => withFallbackResult(undefined, deletePathSync, path, pathStat)

const existPath = async (path) => ErrorNotExist !== await withFallbackResultAsync(ErrorNotExist, fsAsync.access, path) // this checks `fs.constants.F_OK`
const existPathSync = (path) => ErrorNotExist !== withFallbackResult(ErrorNotExist, accessSync, path) // this checks `fs.constants.F_OK`
const ErrorNotExist = new Error()

const nearestExistPath = async (path) => { // use absolute path // NOTE: may be file instead of directory
  while (path && !await existPath(path)) path = dirname(path)
  return path
}
const nearestExistPathSync = (path) => { // use absolute path // NOTE: may be file instead of directory
  while (path && !existPathSync(path)) path = dirname(path)
  return path
}

const toPosixPath = (path) => path.replace(REGEXP_PATH_SEP_WIN32, '/')
const REGEXP_PATH_SEP_WIN32 = /\\/g

const addTrailingSep = (path) => join(path, sep)
const dropTrailingSep = (path) => join(path, '.') // `a/b/c/` -> `a/b/c`

const expandHome = (path) => path === '~' ? homedir()
  : REGEXP_HOME_PREFIX.test(path) ? `${homedir()}${path.slice(1)}`
    : path
const REGEXP_HOME_PREFIX = /^~[/\\]/

const resolveHome = (...argList) => resolve(...argList.map(expandHome))

const createPathPrefixLock = (rootPath) => {
  rootPath = resolve(rootPath)
  return (relativePath) => { // TODO: will silently drop path when used like `ppl('img', 'a.png')`, should add fool-proof error/check?
    const absolutePath = resolve(rootPath, relativePath)
    if (!absolutePath.startsWith(rootPath)) throw new Error(`invalid relativePath: ${relativePath}`)
    return absolutePath
  }
}

export {
  STAT_ERROR,
  PATH_TYPE,

  getPathTypeFromStat,
  getPathLstat, getPathLstatSync, getPathStat, getPathStatSync,

  copyPath, copyPathSync,
  renamePath, renamePathSync,
  deletePath, deletePathSync, deletePathForce, deletePathForceSync,

  existPath, existPathSync,
  nearestExistPath, nearestExistPathSync,
  toPosixPath,
  addTrailingSep, dropTrailingSep,
  expandHome, resolveHome,
  createPathPrefixLock
}
