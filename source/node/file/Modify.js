import { dirname } from 'path'
import { FILE_TYPE, getPathType, createDirectory, deletePath, movePath, copyPath } from './File'
import { getDirectoryContent, copyDirectoryContent, deleteDirectoryContent } from './Directory'

const MODIFY_TYPE = {
  MOVE: 'MOVE',
  COPY: 'COPY',
  DELETE: 'DELETE'
}

// pathTo only needed for copy / move
const modifyFile = async (modifyType, pathFrom, pathTo, pathType) => {
  switch (modifyType) {
    case MODIFY_TYPE.COPY:
      return modifyFile.copy(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.MOVE:
      return modifyFile.move(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.DELETE:
      return modifyFile.delete(pathFrom, pathType)
  }
  throw new Error(`[modifyFile] Error modifyType: ${modifyType}`)
}
modifyFile.copy = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  await createDirectory(dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathType)
}
modifyFile.move = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  await createDirectory(dirname(pathTo))
  return movePath(pathFrom, pathTo, pathType)
}
modifyFile.delete = deletePath

// pathTo only needed for copy / move
const modifyDirectory = async (modifyType, pathFrom, pathTo, pathType) => {
  switch (modifyType) {
    case MODIFY_TYPE.COPY:
      return modifyDirectory.copy(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.MOVE:
      return modifyDirectory.move(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.DELETE:
      return modifyDirectory.delete(pathFrom, pathType)
  }
  throw new Error(`[modifyDirectory] Error modifyType: ${modifyType}`)
}
modifyDirectory.copy = async (pathFrom, pathTo, pathType) => {
  const content = await getDirectoryContent(pathFrom, pathType)
  return copyDirectoryContent(content, pathTo)
}
modifyDirectory.move = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  if (pathType !== FILE_TYPE.Directory) throw new Error(`[modifyDirectory][move] error pathType ${pathType}`)
  return modifyFile.move(pathFrom, pathTo, pathType) // use file move
}
modifyDirectory.delete = async (path, pathType) => {
  const content = await getDirectoryContent(path, pathType)
  await deleteDirectoryContent(content)
  return deletePath(path)
}

const modify = async (modifyType, pathFrom, pathTo, pathType) => {
  switch (modifyType) {
    case MODIFY_TYPE.COPY:
      return modify.copy(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.MOVE:
      return modify.move(pathFrom, pathTo, pathType)
    case MODIFY_TYPE.DELETE:
      return modify.delete(pathFrom, pathType)
  }
  throw new Error(`[modify] Error modifyType: ${modifyType}`)
}
modify.copy = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  if (pathType === FILE_TYPE.Directory) return modifyDirectory.copy(pathFrom, pathTo, pathType)
  else return modifyFile.copy(pathFrom, pathTo, pathType)
}
modify.move = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  if (pathType === FILE_TYPE.Directory) return modifyDirectory.move(pathFrom, pathTo, pathType)
  else return modifyFile.move(pathFrom, pathTo, pathType)
}
modify.delete = async (path, pathType) => {
  if (pathType === undefined) pathType = await getPathType(path)
  if (pathType === FILE_TYPE.Directory) return modifyDirectory.delete(path, pathType)
  else return modifyFile.delete(path, pathType)
}

export {
  MODIFY_TYPE,
  modify,
  modifyFile,
  modifyDirectory
}
