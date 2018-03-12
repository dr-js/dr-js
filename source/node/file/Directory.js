import { join as joinPath, dirname, basename } from 'path'
import { readdirAsync } from './__utils__'
import { FILE_TYPE, getPathType, createDirectory, deletePath, movePath, copyPath } from './File'

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
    const subPath = joinPath(path, name)
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
    [ FILE_TYPE.Other ]: [],
    [ FILE_TYPE.Error ]: []
  }
  for (let index = 0, indexMax = subNameList.length; index < indexMax; index++) {
    const name = subNameList[ index ]
    const subPath = joinPath(path, name)
    const subPathType = await getPathType(subPath)
    switch (subPathType) {
      case FILE_TYPE.Directory:
        content[ subPathType ].set(name, isShallow ? null : await getDirectoryContent(subPath, subPathType, false))
        break
      default:
        content[ subPathType ].push(name)
        break
    }
  }
  return content
}
const getDirectoryContentShallow = (path, pathType) => getDirectoryContent(path, pathType, true)

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
    const pathFrom = joinPath(path, name)
    const pathTo = joinPath(pathToMap[ path ], name)
    pathToMap[ pathFrom ] = pathTo
    return copyPath(pathFrom, pathTo, pathType)
  }, true)
}

const moveDirectoryContent = async (content, pathTo) => {
  await createDirectory(pathTo)
  return walkDirectoryContentShallow(content, (path, name, pathType) => movePath(
    joinPath(path, name),
    joinPath(pathTo, name),
    pathType
  ))
}

const deleteDirectoryContent = async (content) => walkDirectoryContentBottomUp(content, (path, name, pathType) => deletePath(
  joinPath(path, name),
  pathType
))

const getFileList = async (path, fileCollector = DEFAULT_FILE_COLLECTOR) => {
  const fileList = []
  const pathType = await getPathType(path)
  switch (pathType) {
    case FILE_TYPE.File:
      fileCollector(fileList, dirname(path), basename(path))
      break
    case FILE_TYPE.Directory:
      await walkDirectoryContent(
        await getDirectoryContent(path, pathType),
        (path, name, type) => { type === FILE_TYPE.File && fileCollector(fileList, path, name) }
      )
      break
    default:
      throw new Error(`[getFileList] invalid pathType: ${pathType} for ${path}`)
  }
  return fileList
}
const DEFAULT_FILE_COLLECTOR = (fileList, path, name) => fileList.push(joinPath(path, name))

export {
  getDirectoryContentNameList,
  getDirectoryContentFileList,

  getDirectoryContent,
  getDirectoryContentShallow,

  walkDirectoryContent,
  walkDirectoryContentBottomUp,
  walkDirectoryContentShallow,

  copyDirectoryContent,
  moveDirectoryContent,
  deleteDirectoryContent,

  getFileList
}
