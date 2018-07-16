import { resolve, relative, dirname } from 'path'
import { catchAsync } from 'source/common/error'
import { nearestExistAsync, trimPathDepth } from './function'
import { getPathStat, createDirectory, deletePath, movePath, copyPath } from './File'
import { getDirectoryInfoTree, copyDirectoryInfoTree, deleteDirectoryInfoTree } from './Directory'

const move = async (pathFrom, pathTo, pathStat) => {
  await createDirectory(dirname(pathTo))
  return movePath(pathFrom, pathTo, pathStat)
}

const copyFile = async (pathFrom, pathTo, pathStat) => {
  await createDirectory(dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathStat)
}
const deleteFile = (path, pathStat) => deletePath(path, pathStat)

const copyDirectory = async (pathFrom, pathTo, pathStat) => copyDirectoryInfoTree(
  await getDirectoryInfoTree(pathFrom, pathStat),
  pathTo
)
const deleteDirectory = async (path, pathStat) => {
  await deleteDirectoryInfoTree(await getDirectoryInfoTree(path, pathStat))
  return deletePath(path)
}

const modify = {
  move,
  copy: async (pathFrom, pathTo, pathStat) => {
    if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
    return pathStat.isDirectory()
      ? copyDirectory(pathFrom, pathTo, pathStat)
      : copyFile(pathFrom, pathTo, pathStat)
  },
  delete: async (path, pathStat) => {
    if (pathStat === undefined) pathStat = await getPathStat(path)
    return pathStat.isDirectory()
      ? deleteDirectory(path, pathStat)
      : deleteFile(path, pathStat)
  }
}

const withTempDirectory = async (tempPath, asyncTask) => {
  const existPath = await nearestExistAsync(tempPath)
  await createDirectory(tempPath) // also check tempPath is Directory
  if (existPath === tempPath) return asyncTask()
  const deletePath = resolve(existPath, trimPathDepth(relative(existPath, tempPath), 1))
  __DEV__ && console.log('[withTempDirectory]', { tempPath, deletePath })
  const { result, error } = await catchAsync(asyncTask)
  await deleteDirectory(deletePath)
  if (error) throw error
  return result
}

export {
  move,
  copyFile,
  deleteFile,
  copyDirectory,
  deleteDirectory,
  modify,
  withTempDirectory
}
