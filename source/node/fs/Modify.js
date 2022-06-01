import { dirname } from 'node:path'
import { withFallbackResult, withFallbackResultAsync } from 'source/common/error.js'
import { getPathLstat, getPathLstatSync, copyPath, copyPathSync, renamePath, renamePathSync, deletePath, deletePathSync } from './Path.js'
import { createDirectory, createDirectorySync, copyDirectory, copyDirectorySync, deleteDirectory, deleteDirectorySync } from './Directory.js'

const modifyCopy = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(pathFrom)
  if (pathStat.isDirectory()) return copyDirectory(pathFrom, pathTo, pathStat)
  await createDirectory(dirname(pathTo))
  await copyPath(pathFrom, pathTo, pathStat)
}
const modifyCopySync = (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = getPathLstatSync(pathFrom)
  if (pathStat.isDirectory()) return copyDirectorySync(pathFrom, pathTo, pathStat)
  createDirectorySync(dirname(pathTo))
  copyPathSync(pathFrom, pathTo, pathStat)
}

const modifyRename = async (pathFrom, pathTo, pathStat) => {
  await createDirectory(dirname(pathTo))
  await renamePath(pathFrom, pathTo, pathStat)
}
const modifyRenameSync = (pathFrom, pathTo, pathStat) => {
  createDirectorySync(dirname(pathTo))
  renamePathSync(pathFrom, pathTo, pathStat)
}

const modifyDelete = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(path)
  if (pathStat.isDirectory()) return deleteDirectory(path, pathStat)
  await deletePath(path, pathStat)
}
const modifyDeleteSync = (path, pathStat) => {
  if (pathStat === undefined) pathStat = getPathLstatSync(path)
  if (pathStat.isDirectory()) return deleteDirectorySync(path, pathStat)
  deletePathSync(path, pathStat)
}

const modifyDeleteForce = async (path, pathStat) => withFallbackResultAsync(undefined, modifyDelete, path, pathStat)
const modifyDeleteForceSync = (path, pathStat) => withFallbackResult(undefined, modifyDeleteSync, path, pathStat)

export {
  modifyCopy, modifyCopySync,
  modifyRename, modifyRenameSync,
  modifyDelete, modifyDeleteSync, modifyDeleteForce, modifyDeleteForceSync
}
