import { join as joinPath, dirname, basename } from 'path'
import { readdirAsync } from './function'
import { FILE_TYPE, getPathStat, getPathTypeFromStat, createDirectory, deletePath, movePath, copyPath } from './File'

const getDirectorySubInfoList = async (path, pathStat) => {
  // __DEV__ && console.log('getDirectorySubInfoList', { path, pathStat: Boolean(pathStat) })
  if (pathStat === undefined) pathStat = await getPathStat(path)
  if (!pathStat.isDirectory()) throw new Error(`[getDirectorySubInfoList] error pathType: ${getPathTypeFromStat(pathStat)} for ${path}`)
  const subInfoList = []
  for (const name of await readdirAsync(path)) {
    const subPath = joinPath(path, name)
    const stat = await getPathStat(subPath)
    const type = getPathTypeFromStat(stat)
    subInfoList.push({ path: subPath, name, stat, type })
  }
  return subInfoList
}

const getDirectoryInfoTree = async (path, pathStat) => {
  // __DEV__ && console.log('getDirectoryInfoTree', { path, pathStat: Boolean(pathStat) })
  const subInfoListMap = {}
  const queue = [ { path, stat: pathStat } ]
  while (queue.length) {
    const { path, stat } = queue.shift()
    const subInfoList = await getDirectorySubInfoList(path, stat)
    subInfoListMap[ path ] = subInfoList
    subInfoList.forEach((subInfo) => subInfo.stat.isDirectory() && queue.push(subInfo))
  }
  return { root: path, subInfoListMap }
}

const walkDirectoryInfoTree = async ({ root, subInfoListMap }, callback) => { // TODO: use createTreeBreadthFirstSearchAsync?
  const queue = [ { path: root } ]
  while (queue.length) {
    const { path } = queue.shift()
    for (const subInfo of subInfoListMap[ path ]) {
      subInfo.stat.isDirectory() && queue.push(subInfo)
      await callback(subInfo)
    }
  }
}

const walkDirectoryInfoTreeBottomUp = async ({ root, subInfoListMap }, callback) => { // TODO: use createTreeBottomUpSearchAsync?
  const rootInfo = { path: root }
  const stack = [ [ rootInfo, [ rootInfo ] ] ]
  while (stack.length) {
    const [ upperInfo, infoList ] = stack[ stack.length - 1 ]
    if (infoList.length === 0) {
      upperInfo !== rootInfo && await callback(upperInfo)
      stack.pop()
    } else {
      const info = infoList.shift()
      const subInfoList = []
      for (const subInfo of subInfoListMap[ info.path ]) {
        subInfo.stat.isDirectory()
          ? subInfoList.push(subInfo)
          : await callback(subInfo)
      }
      stack.push([ info, subInfoList ])
    }
  }
}

const copyDirectoryInfoTree = async (infoTree, pathTo) => {
  await createDirectory(pathTo)
  const pathToMap = { [ infoTree.root ]: pathTo }
  return walkDirectoryInfoTree(infoTree, ({ path, name, stat }) => {
    const upperPath = dirname(path)
    const pathTo = joinPath(pathToMap[ upperPath ], name)
    pathToMap[ path ] = pathTo
    return copyPath(path, pathTo, stat)
  })
}

const moveDirectoryInfoTree = async ({ root, subInfoListMap }, pathTo) => {
  await createDirectory(pathTo)
  for (const { path, name, stat } of subInfoListMap[ root ]) await movePath(path, joinPath(pathTo, name), stat)
}

const deleteDirectoryInfoTree = async (infoTree) => walkDirectoryInfoTreeBottomUp(
  infoTree,
  ({ path, stat }) => deletePath(path, stat)
)

const getFileList = async (path, fileCollector = DEFAULT_FILE_COLLECTOR) => {
  const fileList = []
  const pathStat = await getPathStat(path)
  const pathType = getPathTypeFromStat(pathStat)
  switch (pathType) {
    case FILE_TYPE.File:
      fileCollector(fileList, { path, name: basename(path), stat: pathStat, type: pathType })
      break
    case FILE_TYPE.Directory:
      await walkDirectoryInfoTree(
        await getDirectoryInfoTree(path, pathStat),
        (info) => info.type === FILE_TYPE.File && fileCollector(fileList, info)
      )
      break
    default:
      throw new Error(`[getFileList] invalid pathType: ${pathType} for ${path}`)
  }
  return fileList
}
const DEFAULT_FILE_COLLECTOR = (fileList, { path }) => fileList.push(path)

export {
  getDirectorySubInfoList,
  getDirectoryInfoTree,
  walkDirectoryInfoTree,
  walkDirectoryInfoTreeBottomUp,
  copyDirectoryInfoTree,
  moveDirectoryInfoTree,
  deleteDirectoryInfoTree,
  getFileList
}
