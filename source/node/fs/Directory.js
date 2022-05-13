import { join, dirname, basename } from 'node:path'
import { readdirSync, mkdirSync, promises as fsAsync } from 'node:fs'
import { tmpdir } from 'node:os'
import { catchSync, catchAsync } from 'source/common/error.js'
import { getRandomId } from 'source/common/math/random.js'
import {
  createTreeBreadthFirstSearch, createTreeBreadthFirstSearchAsync,
  createTreeBottomUpSearch, createTreeBottomUpSearchAsync
} from 'source/common/data/Tree.js'
import {
  STAT_ERROR, PATH_TYPE, getPathTypeFromStat, dropTrailingSep,
  getPathStat, getPathStatSync,
  copyPath, copyPathSync,
  renamePath, renamePathSync,
  deletePath, deletePathSync
} from './Path.js'

const getPathTypeFromDirent = (dirent) => dirent.isSymbolicLink() ? PATH_TYPE.Symlink // need stat again to get the target type
  : dirent.isDirectory() ? PATH_TYPE.Directory
    : dirent.isFile() ? PATH_TYPE.File
      : PATH_TYPE.Other

const getDirInfoList = async (path) => {
  const dirInfoList = []
  for (const dirent of await fsAsync.readdir(path, { withFileTypes: true })) {
    const type = getPathTypeFromDirent(dirent)
    const { name } = dirent
    dirInfoList.push({ type, name, path: join(path, name) })
  }
  return dirInfoList
}
const getDirInfoListSync = (path) => {
  const dirInfoList = []
  for (const dirent of readdirSync(path, { withFileTypes: true })) {
    const type = getPathTypeFromDirent(dirent)
    const { name } = dirent
    dirInfoList.push({ type, name, path: join(path, name) })
  }
  return dirInfoList
}

const getDirInfoTree = async (path) => {
  path = dropTrailingSep(path)
  const dirInfoListMap = new Map()
  const queue = [ path ]
  while (queue.length) {
    const upperPath = queue.shift()
    const dirInfoList = await getDirInfoList(upperPath)
    dirInfoListMap.set(upperPath, dirInfoList)
    dirInfoList.forEach(({ type, path }) => type === PATH_TYPE.Directory && queue.push(path))
  }
  return { root: path, dirInfoListMap }
}
const getDirInfoTreeSync = (path) => {
  path = dropTrailingSep(path)
  const dirInfoListMap = new Map()
  const queue = [ path ]
  while (queue.length) {
    const upperPath = queue.shift()
    const dirInfoList = getDirInfoListSync(upperPath)
    dirInfoListMap.set(upperPath, dirInfoList)
    dirInfoList.forEach(({ type, path }) => type === PATH_TYPE.Directory && queue.push(path))
  }
  return { root: path, dirInfoListMap }
}

const getSubNodeListFunc = (dirInfo, dirInfoListMap) => dirInfoListMap.get(dirInfo.path)
const dirInfoTreeBreadthFirstSearchAsync = createTreeBreadthFirstSearchAsync(getSubNodeListFunc)
const dirInfoTreeBreadthFirstSearchSync = createTreeBreadthFirstSearch(getSubNodeListFunc)
const dirInfoTreeBottomUpSearchAsync = createTreeBottomUpSearchAsync(getSubNodeListFunc)
const dirInfoTreeBottomUpSearchSync = createTreeBottomUpSearch(getSubNodeListFunc)

const walkDirInfoTree = async (
  { root, dirInfoListMap },
  callback // async (dirInfo) => true/false // return true to end search
) => dirInfoTreeBreadthFirstSearchAsync({ path: root }, callback, dirInfoListMap)
const walkDirInfoTreeSync = (
  { root, dirInfoListMap },
  callback // (dirInfo) => true/false // return true to end search
) => dirInfoTreeBreadthFirstSearchSync({ path: root }, callback, dirInfoListMap)
const walkDirInfoTreeBottomUp = async (
  { root, dirInfoListMap },
  callback // async (dirInfo) => true/false // return true to end search
) => dirInfoTreeBottomUpSearchAsync({ path: root }, callback, dirInfoListMap)
const walkDirInfoTreeBottomUpSync = (
  { root, dirInfoListMap },
  callback // (dirInfo) => true/false // return true to end search
) => dirInfoTreeBottomUpSearchSync({ path: root }, callback, dirInfoListMap)

const copyDirInfoTree = async (dirInfoTree, pathTo) => {
  await createDirectory(pathTo)
  const pathToMap = new Map()
  pathToMap.set(dirInfoTree.root, pathTo)
  return walkDirInfoTree(dirInfoTree, async ({ name, path }) => {
    const upperPath = dirname(path)
    const pathTo = join(pathToMap.get(upperPath), name)
    pathToMap.set(path, pathTo)
    await copyPath(path, pathTo) // resolve to nothing
  })
}
const copyDirInfoTreeSync = (dirInfoTree, pathTo) => {
  createDirectorySync(pathTo)
  const pathToMap = new Map()
  pathToMap.set(dirInfoTree.root, pathTo)
  return walkDirInfoTreeSync(dirInfoTree, ({ name, path }) => {
    const upperPath = dirname(path)
    const pathTo = join(pathToMap.get(upperPath), name)
    pathToMap.set(path, pathTo)
    copyPathSync(path, pathTo) // resolve to nothing
  })
}

const renameDirInfoTree = async ({ root, dirInfoListMap }, pathTo) => {
  await createDirectory(pathTo)
  for (const { name, path } of dirInfoListMap.get(root)) await renamePath(path, join(pathTo, name))
}
const renameDirInfoTreeSync = ({ root, dirInfoListMap }, pathTo) => {
  createDirectorySync(pathTo)
  for (const { name, path } of dirInfoListMap.get(root)) renamePathSync(path, join(pathTo, name))
}

const deleteDirInfoTree = async (dirInfoListMap) => walkDirInfoTreeBottomUp(
  dirInfoListMap,
  ({ path }) => deletePath(path) // resolve to nothing
)
const deleteDirInfoTreeSync = (dirInfoListMap) => walkDirInfoTreeBottomUpSync(
  dirInfoListMap,
  ({ path }) => deletePathSync(path) // resolve to nothing
)

const createDirectory = async (path, pathStat) => {
  if (pathStat !== undefined) {
    if (pathStat.isDirectory()) return // directory exist, pass
    if (pathStat !== STAT_ERROR) throw new Error(`path already taken by non-directory: ${path}`)
  }
  await fsAsync.mkdir(path, { recursive: true }) // create directory
}
const createDirectorySync = (path, pathStat) => {
  if (pathStat !== undefined) {
    if (pathStat.isDirectory()) return // directory exist, pass
    if (pathStat !== STAT_ERROR) throw new Error(`path already taken by non-directory: ${path}`)
  }
  mkdirSync(path, { recursive: true }) // create directory
}

const copyDirectory = async (pathFrom, pathTo, pathStat) => copyDirInfoTree(await getDirInfoTree(pathFrom, pathStat), pathTo)
const copyDirectorySync = (pathFrom, pathTo, pathStat) => copyDirInfoTreeSync(getDirInfoTreeSync(pathFrom, pathStat), pathTo)

const deleteDirectory = async (path, pathStat) => {
  await deleteDirInfoTree(await getDirInfoTree(path, pathStat)) // delete all content
  await deletePath(path, pathStat) // delete dir
}
const deleteDirectorySync = (path, pathStat) => {
  deleteDirInfoTreeSync(getDirInfoTreeSync(path, pathStat)) // delete all content
  deletePathSync(path, pathStat) // delete dir
}

const resetDirectory = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path) // resolve symlink for the initial path
  if (!pathStat.isDirectory()) {
    pathStat !== STAT_ERROR && await deletePath(path, pathStat)
    await createDirectory(path)
  } else await deleteDirInfoTree(await getDirInfoTree(path, pathStat)) // delete all content
}
const resetDirectorySync = (path, pathStat) => {
  if (pathStat === undefined) pathStat = getPathStatSync(path) // resolve symlink for the initial path
  if (!pathStat.isDirectory()) {
    pathStat !== STAT_ERROR && deletePathSync(path, pathStat)
    createDirectorySync(path)
  } else deleteDirInfoTreeSync(getDirInfoTreeSync(path, pathStat)) // delete all content
}

const withTempDirectory = async (
  asyncFunc, // = async (pathTemp) => {}
  pathTemp = join(tmpdir(), 'dr-js', getRandomId('temp-'))
) => {
  await resetDirectory(pathTemp) // reset existing content
  const { result, error } = await catchAsync(asyncFunc, pathTemp)
  await deleteDirectory(pathTemp)
  if (error) throw error
  return result
}
const withTempDirectorySync = (
  syncFunc, // = async (pathTemp) => {}
  pathTemp = join(tmpdir(), 'dr-js', getRandomId('temp-'))
) => {
  resetDirectorySync(pathTemp) // reset existing content
  const { result, error } = catchSync(syncFunc, pathTemp)
  deleteDirectorySync(pathTemp)
  if (error) throw error
  return result
}

const getFileList = async (
  path,
  fileCollector = DEFAULT_FILE_COLLECTOR // (fileList, { path }) => { fileList.push(path) } // TODO: NOTE: symlink will get skipped, return true will end search, is it needed or cause mostly error?
) => {
  const fileList = []
  const pathStat = await getPathStat(path) // resolve symlink for the initial path
  const pathType = getPathTypeFromStat(pathStat)
  switch (pathType) {
    case PATH_TYPE.File:
      fileCollector(fileList, { type: pathType, name: basename(path), path })
      break
    case PATH_TYPE.Directory:
      await walkDirInfoTree(
        await getDirInfoTree(path, pathStat),
        (dirInfo) => dirInfo.type === PATH_TYPE.File && fileCollector(fileList, dirInfo)
      )
      break
    default:
      throw new Error(`invalid pathType: ${pathType} for ${path}`)
  }
  return fileList
}
const getFileListSync = (
  path,
  fileCollector = DEFAULT_FILE_COLLECTOR // (fileList, { path }) => { fileList.push(path) } // TODO: NOTE: symlink will get skipped, return true will end search, is it needed or cause mostly error?
) => {
  const fileList = []
  const pathStat = getPathStatSync(path) // resolve symlink for the initial path
  const pathType = getPathTypeFromStat(pathStat)
  switch (pathType) {
    case PATH_TYPE.File:
      fileCollector(fileList, { type: pathType, name: basename(path), path })
      break
    case PATH_TYPE.Directory:
      walkDirInfoTreeSync(
        getDirInfoTreeSync(path, pathStat),
        (dirInfo) => dirInfo.type === PATH_TYPE.File && fileCollector(fileList, dirInfo)
      )
      break
    default:
      throw new Error(`invalid pathType: ${pathType} for ${path}`)
  }
  return fileList
}
const DEFAULT_FILE_COLLECTOR = (fileList, { path }) => { fileList.push(path) }

export {
  getPathTypeFromDirent,
  getDirInfoList, getDirInfoListSync,
  getDirInfoTree, getDirInfoTreeSync,

  walkDirInfoTree, walkDirInfoTreeSync,
  walkDirInfoTreeBottomUp, walkDirInfoTreeBottomUpSync,

  copyDirInfoTree, copyDirInfoTreeSync,
  renameDirInfoTree, renameDirInfoTreeSync,
  deleteDirInfoTree, deleteDirInfoTreeSync,

  createDirectory, createDirectorySync,
  copyDirectory, copyDirectorySync,
  deleteDirectory, deleteDirectorySync,
  resetDirectory, resetDirectorySync,

  withTempDirectory, withTempDirectorySync,
  getFileList, getFileListSync
}
