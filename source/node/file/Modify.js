import { resolve, relative, dirname } from 'path'
import { catchAsync } from 'source/common/error'
import { nearestExistAsync, trimPathDepth } from './function'
import { FILE_TYPE, getPathType, createDirectory, deletePath, movePath, copyPath } from './File'
import { getDirectoryContent, copyDirectoryContent, deleteDirectoryContent } from './Directory'

const copyFile = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  await createDirectory(dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathType)
}
const moveFile = async (pathFrom, pathTo, pathType) => {
  await createDirectory(dirname(pathTo))
  return movePath(pathFrom, pathTo, pathType)
}
const deleteFile = (path, pathType) => deletePath(path, pathType)

const copyDirectory = async (pathFrom, pathTo, pathType) => copyDirectoryContent(
  await getDirectoryContent(pathFrom, pathType),
  pathTo
)
const moveDirectory = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  if (pathType !== FILE_TYPE.Directory) throw new Error(`[moveDirectory] error pathType ${pathType}`)
  await createDirectory(dirname(pathTo))
  return movePath(pathFrom, pathTo, pathType)
}
const deleteDirectory = async (path, pathType) => {
  await deleteDirectoryContent(await getDirectoryContent(path, pathType))
  return deletePath(path)
}

const modify = {
  copy: async (pathFrom, pathTo, pathType) => {
    if (pathType === undefined) pathType = await getPathType(pathFrom)
    return pathType === FILE_TYPE.Directory
      ? copyDirectory(pathFrom, pathTo, pathType)
      : copyFile(pathFrom, pathTo, pathType)
  },
  move: async (pathFrom, pathTo, pathType) => {
    await createDirectory(dirname(pathTo))
    return movePath(pathFrom, pathTo, pathType)
  },
  delete: async (path, pathType) => {
    if (pathType === undefined) pathType = await getPathType(path)
    return pathType === FILE_TYPE.Directory
      ? deleteDirectory(path, pathType)
      : deleteFile(path, pathType)
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
  copyFile,
  moveFile,
  deleteFile,
  copyDirectory,
  moveDirectory,
  deleteDirectory,
  modify,
  withTempDirectory
}
