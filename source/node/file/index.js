import nodeModulePath from 'path'

import {
  FILE_TYPE,

  getPathType,
  createDirectory,
  copyFile,

  deletePath,
  movePath,
  copyPath
} from './File'

import {
  getDirectoryContentNameList,
  getDirectoryContentFileList,

  getDirectoryContent,
  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,

  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent
} from './Directory'

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
      return deletePath(pathFrom, pathType)
  }
  throw new Error(`[modifyFile] Error modifyType: ${modifyType}`)
}
modifyFile.copy = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  await createDirectory(nodeModulePath.dirname(pathTo))
  return copyPath(pathFrom, pathTo, pathType)
}
modifyFile.move = async (pathFrom, pathTo, pathType) => {
  if (pathType === undefined) pathType = await getPathType(pathFrom)
  await createDirectory(nodeModulePath.dirname(pathTo))
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

const getFileList = async (path, getFileCollector = defaultFileCollectorCreator) => {
  const fileList = []
  const fileCollector = getFileCollector(fileList)

  const pathType = await getPathType(path)
  switch (pathType) {
    case FILE_TYPE.File:
      fileCollector(nodeModulePath.dirname(path), nodeModulePath.basename(path))
      break
    case FILE_TYPE.Directory:
      const content = await getDirectoryContent(path, pathType)
      await walkDirectoryContent(content, (path, name, type) => { (type === FILE_TYPE.File) && fileCollector(path, name) })
      break
    default:
      throw new Error(`[getFileList] Error pathType: ${pathType} for ${path}`)
  }

  return fileList
}
const defaultFileCollectorCreator = (fileList) => (path, name) => fileList.push(nodeModulePath.join(path, name))
const extnameFilterFileCollectorCreator = (extname) => (fileList) => (path, name) => { // extname like '.js', mostly as a sample
  if (extname !== nodeModulePath.extname(name)) return
  fileList.push(nodeModulePath.join(path, name))
}
const prefixMapperFileCollectorCreator = (prefix) => (fileList) => (path, name) => fileList.push([ // mostly as a sample
  nodeModulePath.join(path, name),
  nodeModulePath.join(path, prefix + name)
])

export {
  FILE_TYPE,
  getPathType,
  createDirectory,
  copyFile,
  deletePath,
  movePath,
  copyPath,

  getDirectoryContentNameList,
  getDirectoryContentFileList,
  getDirectoryContent,
  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,
  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent,

  MODIFY_TYPE,
  modifyFile,
  modifyDirectory,

  getFileList,
  extnameFilterFileCollectorCreator,
  prefixMapperFileCollectorCreator
}
