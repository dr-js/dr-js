import { Stats, promises as fsAsync } from 'fs'
import { join, resolve, dirname } from 'path'
import { homedir } from 'os'

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

const getPathLstat = (path) => fsAsync.lstat(path).catch(onStatError)
const getPathStat = (path) => fsAsync.stat(path).catch(onStatError)
const onStatError = (error) => {
  __DEV__ && console.log('[getPathStat] error', error)
  return STAT_ERROR
}

// NOT recursive operation
const copyPath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(pathFrom)
  return pathStat.isSymbolicLink() ? fsAsync.symlink(await fsAsync.readlink(pathFrom), pathTo) // resolve to nothing
    : pathStat.isDirectory() ? ((await getPathLstat(pathTo)).isDirectory() ? undefined : fsAsync.mkdir(pathTo)) // resolve to nothing
      : fsAsync.copyFile(pathFrom, pathTo) // resolve to nothing
}

const renamePath = async (pathFrom, pathTo) => fsAsync.rename(pathFrom, pathTo) // resolve to nothing

const deletePath = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(path)
  return pathStat.isDirectory()
    ? fsAsync.rmdir(path) // resolve to nothing
    : fsAsync.unlink(path) // resolve to nothing
}
const deletePathForce = async (path, pathStat) => deletePath(path, pathStat).catch((error) => { __DEV__ && console.log('[deletePathForce]', path, error) })

const existPath = async (path) => ErrorNotExist !== await fsAsync.access(path).catch(existFail) // this checks `fs.constants.F_OK`
const existFail = () => ErrorNotExist
const ErrorNotExist = new Error()

const nearestExistPath = async (path) => { // use absolute path // NOTE: may be file instead of directory
  while (path && !await existPath(path)) path = dirname(path)
  return path
}

const toPosixPath = (path) => path.replace(REGEXP_PATH_SEP_WIN32, '/')
const REGEXP_PATH_SEP_WIN32 = /\\/g

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
  getPathLstat, getPathStat,

  copyPath,
  renamePath,
  deletePath, deletePathForce,

  existPath, nearestExistPath,
  toPosixPath, dropTrailingSep,
  expandHome, resolveHome,
  createPathPrefixLock
}
