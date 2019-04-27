import { Stats } from 'fs'
import { dirname } from 'path'
import {
  statAsync,
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
  Other: 'Other', // maybe device, socket or else
  Error: 'Error' // non exist
}

const onStatError = (error) => {
  __DEV__ && console.log('[getPathStat] error', error)
  return ERROR_STAT
}
const onTrimError = (error) => {
  __DEV__ && console.log('[trimDirectory] error', error)
  if (error && error.code === ERROR_NON_EMPTY) return ERROR_NON_EMPTY
  throw error
}
const ERROR_NON_EMPTY = 'ENOTEMPTY'

const getPathStat = (path) => statAsync(path).catch(onStatError)

const getPathTypeFromStat = (stat) => stat.isDirectory() ? FILE_TYPE.Directory
  : stat.isFile() ? FILE_TYPE.File
    : stat !== ERROR_STAT ? FILE_TYPE.Other
      : FILE_TYPE.Error

const createDirectory = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path)
  if (pathStat.isDirectory()) return // directory exist, pass
  if (pathStat !== ERROR_STAT) throw new Error(`path already taken by non-directory: ${path}`)
  await createDirectory(dirname(path)) // check up
  await mkdirAsync(path) // create directory
}
const trimDirectory = async (path, maxLevel = 1, pathStat) => {
  if (!maxLevel) return
  if (pathStat === undefined) pathStat = await getPathStat(path)
  if (pathStat !== ERROR_STAT) { // directory exist
    if (!pathStat.isDirectory()) throw new Error(`path taken by non-directory: ${path}`)
    if (await rmdirAsync(path).catch(onTrimError) === ERROR_NON_EMPTY) return // try delete if empty // TODO: or use slower readDir ?
  }
  await trimDirectory(dirname(path), maxLevel - 1) // check up
}

// NOT recursive operation
const movePath = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat === ERROR_STAT) throw new Error(`missing path from ${pathFrom}`)
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
  trimDirectory,

  movePath,
  copyPath,
  deletePath
}
