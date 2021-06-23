import { join, dirname, basename } from 'path'
import { promises as fsAsync } from 'fs'
import { createTreeBreadthFirstSearchAsync, createTreeBottomUpSearchAsync } from 'source/common/data/Tree'
import { STAT_ERROR, PATH_TYPE, getPathStat, getPathTypeFromStat, copyPath, renamePath, deletePath, dropTrailingSep } from './Path'

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

const getSubNodeListFunc = (dirInfo, dirInfoListMap) => dirInfoListMap.get(dirInfo.path)
const dirInfoTreeBreadthFirstSearchAsync = createTreeBreadthFirstSearchAsync(getSubNodeListFunc)
const dirInfoTreeBottomUpSearchAsync = createTreeBottomUpSearchAsync(getSubNodeListFunc)

const walkDirInfoTreeAsync = async (
  { root, dirInfoListMap },
  callback // async (dirInfo) => true/false // return true to end search
) => dirInfoTreeBreadthFirstSearchAsync({ path: root }, callback, dirInfoListMap)
const walkDirInfoTreeBottomUpAsync = async (
  { root, dirInfoListMap },
  callback // async (dirInfo) => true/false // return true to end search
) => dirInfoTreeBottomUpSearchAsync({ path: root }, callback, dirInfoListMap)

const copyDirInfoTree = async (dirInfoTree, pathTo) => {
  await createDirectory(pathTo)
  const pathToMap = new Map()
  pathToMap.set(dirInfoTree.root, pathTo)
  return walkDirInfoTreeAsync(dirInfoTree, async ({ name, path }) => {
    const upperPath = dirname(path)
    const pathTo = join(pathToMap.get(upperPath), name)
    pathToMap.set(path, pathTo)
    return copyPath(path, pathTo) // resolve to nothing
  })
}

const renameDirInfoTree = async ({ root, dirInfoListMap }, pathTo) => {
  await createDirectory(pathTo)
  for (const { name, path } of dirInfoListMap.get(root)) await renamePath(path, join(pathTo, name))
}

const deleteDirInfoTree = async (dirInfoListMap) => walkDirInfoTreeBottomUpAsync(
  dirInfoListMap,
  ({ path }) => deletePath(path) // resolve to nothing
)

const createDirectory = async (path, pathStat) => {
  if (pathStat !== undefined) {
    if (pathStat.isDirectory()) return // directory exist, pass
    if (pathStat !== STAT_ERROR) throw new Error(`path already taken by non-directory: ${path}`)
  }
  await fsAsync.mkdir(path, { recursive: true }) // create directory
}

const copyDirectory = async (pathFrom, pathTo, pathStat) => copyDirInfoTree(await getDirInfoTree(pathFrom, pathStat), pathTo)

const deleteDirectory = async (path, pathStat) => {
  await deleteDirInfoTree(await getDirInfoTree(path, pathStat)) // delete all content
  return deletePath(path, pathStat) // delete dir
}

const resetDirectory = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path) // resolve symlink for the initial path
  if (!pathStat.isDirectory()) {
    pathStat !== STAT_ERROR && await deletePath(path, pathStat)
    await createDirectory(path)
  } else await deleteDirInfoTree(await getDirInfoTree(path, pathStat)) // delete all content
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
      await walkDirInfoTreeAsync(
        await getDirInfoTree(path, pathStat),
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
  getDirInfoList,
  getDirInfoTree,

  walkDirInfoTreeAsync,
  walkDirInfoTreeBottomUpAsync,

  copyDirInfoTree,
  renameDirInfoTree,
  deleteDirInfoTree,

  createDirectory,
  copyDirectory,
  deleteDirectory, resetDirectory,

  getFileList
}
