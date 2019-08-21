import { dirname } from 'path'
import { getPathStat, deletePath, movePath, copyPath } from './Path'
import { createDirectory, copyDirectory, deleteDirectory } from './Directory'

const NULL_FUNC = () => {}

const modifyMove = async (pathFrom, pathTo, pathStat) => {
  await createDirectory(dirname(pathTo))
  return movePath(pathFrom, pathTo, pathStat)
}

const modifyCopy = async (pathFrom, pathTo, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(pathFrom)
  if (pathStat.isDirectory()) return copyDirectory(pathFrom, pathTo, pathStat)
  await createDirectory(dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathStat)
}

const modifyDelete = async (path, pathStat) => {
  if (pathStat === undefined) pathStat = await getPathStat(path)
  if (pathStat.isDirectory()) return deleteDirectory(path, pathStat)
  return deletePath(path, pathStat)
}

const modifyDeleteForce = async (path, pathStat) => modifyDelete(path, pathStat).catch(NULL_FUNC)

export {
  modifyMove,
  modifyCopy,
  modifyDelete,
  modifyDeleteForce
}
