import nodeModuleFs from 'fs'
import nodeModulePath from 'path'
import { promisify } from 'util'

import {
  FILE_TYPE,

  getPathType,
  createDirectory,

  deletePath,
  movePath,
  copyPath
} from './File'

const readdirAsync = promisify(nodeModuleFs.readdir)

const getDirectoryContentNameList = async (path, pathType) => {
  if (pathType === undefined) pathType = await getPathType(path)
  if (pathType !== FILE_TYPE.Directory) throw new Error(`[getDirectoryContent] error pathType: ${pathType} for ${path}`)
  return readdirAsync(path)
}

// one level only
const getDirectoryContentFileList = async (path, pathType) => {
  const subNameList = await getDirectoryContentNameList(path, pathType)
  const fileList = []
  for (let index = 0, indexMax = subNameList.length; index < indexMax; index++) {
    const name = subNameList[ index ]
    const subPath = nodeModulePath.join(path, name)
    if (await getPathType(subPath) === FILE_TYPE.File) fileList.push(name)
  }
  return fileList
}

// will check recursively
const getDirectoryContent = async (path, pathType, isShallow = false) => {
  if (pathType === undefined) pathType = await getPathType(path)
  const subNameList = await getDirectoryContentNameList(path, pathType)
  const content = {
    path,
    pathType,
    [ FILE_TYPE.Directory ]: new Map(), // name - sub Directory
    [ FILE_TYPE.File ]: [],
    [ FILE_TYPE.SymbolicLink ]: [],
    [ FILE_TYPE.Other ]: []
  }
  for (let index = 0, indexMax = subNameList.length; index < indexMax; index++) {
    const name = subNameList[ index ]
    const subPath = nodeModulePath.join(path, name)
    const subPathType = await getPathType(subPath)
    switch (subPathType) {
      case FILE_TYPE.Directory:
        content[ subPathType ].set(name, isShallow ? null : await getDirectoryContent(subPath, subPathType, false))
        break
      case FILE_TYPE.File:
      case FILE_TYPE.SymbolicLink:
      case FILE_TYPE.Other:
        content[ subPathType ].push(name)
        break
      default:
        throw new Error(`[getDirectoryContent] error subPathType: ${subPathType} for ${subPath}`)
    }
  }
  return content
}

const WALK_FILE_TYPE_LIST = [ FILE_TYPE.File, FILE_TYPE.SymbolicLink, FILE_TYPE.Other ]

const walkDirectoryContent = async (content, callback) => {
  for (const fileType of WALK_FILE_TYPE_LIST) {
    const nameList = content[ fileType ]
    for (const name of nameList) await callback(content.path, name, fileType)
  }
  const subDirectoryMap = content[ FILE_TYPE.Directory ]
  for (let [ name, subContent ] of subDirectoryMap) {
    await callback(content.path, name, FILE_TYPE.Directory)
    await walkDirectoryContent(subContent, callback) // next level
  }
}

const walkDirectoryContentBottomUp = async (content, callback) => {
  const subDirectoryMap = content[ FILE_TYPE.Directory ]
  for (let [ name, subContent ] of subDirectoryMap) {
    await walkDirectoryContentBottomUp(subContent, callback) // next level
    await callback(content.path, name, FILE_TYPE.Directory)
  }
  for (const fileType of WALK_FILE_TYPE_LIST) {
    const nameList = content[ fileType ]
    for (const name of nameList) await callback(content.path, name, fileType)
  }
}

const walkDirectoryContentShallow = async (content, callback) => {
  for (const fileType of WALK_FILE_TYPE_LIST) {
    const nameList = content[ fileType ]
    for (const name of nameList) await callback(content.path, name, fileType)
  }
  const subDirectoryMap = content[ FILE_TYPE.Directory ]
  for (let [ name ] of subDirectoryMap) await callback(content.path, name, FILE_TYPE.Directory)
}

const copyDirectoryContent = async (content, pathTo) => {
  await createDirectory(pathTo)
  const pathToMap = { [ content.path ]: pathTo }
  return walkDirectoryContent(content, (path, name, pathType) => {
    const pathFrom = nodeModulePath.join(path, name)
    const pathTo = nodeModulePath.join(pathToMap[ path ], name)
    pathToMap[ pathFrom ] = pathTo
    return copyPath(pathFrom, pathTo, pathType)
  }, true)
}

const moveDirectoryContent = async (contentShallow, pathTo) => {
  await createDirectory(pathTo)
  return walkDirectoryContentShallow(contentShallow, (path, name, pathType) => movePath(
    nodeModulePath.join(path, name),
    nodeModulePath.join(pathTo, name),
    pathType
  ))
}

const deleteDirectoryContent = async (content) => walkDirectoryContentBottomUp(content, (path, name, pathType) => deletePath(
  nodeModulePath.join(path, name),
  pathType
))

export {
  getDirectoryContentNameList,
  getDirectoryContentFileList,

  getDirectoryContent,
  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,

  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent
}
