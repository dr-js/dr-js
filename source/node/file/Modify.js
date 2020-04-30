import { dirname } from 'path'
import { getPathLstat, copyPath, renamePath, deletePath } from './Path'
import { createDirectory, copyDirectory, deleteDirectory } from './Directory'

const NULL_FUNC = () => {}

const modifyCopy = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(pathFrom)
  if (pathStat.isDirectory()) return copyDirectory(pathFrom, pathTo, pathStat)
  await createDirectory(dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathStat)
}

const modifyRename = async (pathFrom, pathTo, pathStat) => {
  await createDirectory(dirname(pathTo))
  return renamePath(pathFrom, pathTo, pathStat)
}

const modifyDelete = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathLstat(path)
  if (pathStat.isDirectory()) return deleteDirectory(path, pathStat)
  return deletePath(path, pathStat)
}

const modifyDeleteForce = async (path, pathStat) => modifyDelete(path, pathStat).catch(NULL_FUNC)

export {
  modifyCopy,
  modifyRename,
  modifyDelete,
  modifyDeleteForce
}
