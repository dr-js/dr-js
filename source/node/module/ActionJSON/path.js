import { posix, relative } from 'node:path'
import { promises as fsAsync } from 'node:fs'

import { catchAsync } from 'source/common/error.js'
import { objectMap } from 'source/common/immutable/Object.js'
import { PATH_TYPE, getPathStat, existPath, toPosixPath, createPathPrefixLock } from 'source/node/fs/Path.js'
import { getDirInfoList, getDirInfoTree, walkDirInfoTree, createDirectory } from 'source/node/fs/Directory.js'
import { modifyRename, modifyCopy, modifyDelete } from 'source/node/fs/Modify.js'

const PATH_VISIBLE = 'path.visible'
const PATH_STAT = 'path.stat'
const PATH_COPY = 'path.copy'
const PATH_RENAME = 'path.rename'
const PATH_DELETE = 'path.delete'

const PATH_DIRECTORY_CREATE = 'path.dir.create'
const PATH_DIRECTORY_CONTENT = 'path.dir.content'
const PATH_DIRECTORY_ALL_FILE_LIST = 'path.dir.all-file-list'

const ACTION_TYPE = { // NOTE: should always refer action type form here
  PATH_VISIBLE,
  PATH_STAT,
  PATH_COPY,
  PATH_RENAME,
  PATH_DELETE,

  PATH_DIRECTORY_CREATE,
  PATH_DIRECTORY_CONTENT,
  PATH_DIRECTORY_ALL_FILE_LIST
}

const ACTION_CORE_MAP = { // all async
  [ PATH_VISIBLE ]: async (absolutePath) => existPath(absolutePath).then((isVisible) => ({ isVisible })),
  [ PATH_STAT ]: async (absolutePath) => fsAsync.stat(absolutePath).then(({ mode, size, mtimeMs }) => ({ mode, size, mtimeMs })),
  [ PATH_COPY ]: async (absolutePath, absolutePathTo) => { await modifyCopy(absolutePath, absolutePathTo) },
  [ PATH_RENAME ]: async (absolutePath, absolutePathTo) => { await modifyRename(absolutePath, absolutePathTo) },
  [ PATH_DELETE ]: async (absolutePath) => { await modifyDelete(absolutePath) },

  [ PATH_DIRECTORY_CREATE ]: async (absolutePath) => { await createDirectory(absolutePath) },
  [ PATH_DIRECTORY_CONTENT ]: async (absolutePath) => { // single level, both file & directory
    const { result: dirInfoList = [], error } = await catchAsync(getDirInfoList, absolutePath)
    __DEV__ && error && console.warn('[PATH_DIRECTORY_CONTENT] error:', error)
    const directoryList = [] // name only
    const fileList = [] // [ name, size, mtimeMs ] // TODO: unify array type?
    for (const { type, name, path } of dirInfoList) {
      const stat = (type === PATH_TYPE.Directory) || await getPathStat(path)
      if (stat === true || stat.isDirectory()) directoryList.push(name)
      else fileList.push([ name, stat.size, Math.round(stat.mtimeMs) ])
    }
    return { directoryList, fileList }
  },
  [ PATH_DIRECTORY_ALL_FILE_LIST ]: async (absolutePath) => { // recursive, file only
    const fileList = [] // [ name, size, mtimeMs ]
    const { error } = await catchAsync(async () => walkDirInfoTree(
      await getDirInfoTree(absolutePath),
      async ({ type, path }) => {
        const stat = (type === PATH_TYPE.Directory) || await getPathStat(path)
        stat !== true && !stat.isDirectory() && fileList.push([ toPosixPath(relative(absolutePath, path)), stat.size, Math.round(stat.mtimeMs) ])
      }
    ))
    __DEV__ && console.log('[PATH_DIRECTORY_ALL_FILE_LIST] fileList:', fileList)
    __DEV__ && error && console.warn('[PATH_DIRECTORY_ALL_FILE_LIST] error:', error)
    return { fileList }
  }
}

const setupActionMap = ({
  actionCoreMap = ACTION_CORE_MAP,
  rootPath, getPath = createPathPrefixLock(rootPath),
  loggerExot
}) => {
  const calcPath = (key, extraPath) => getPath(posix.normalize(posix.join(key, extraPath))) // normalize & convert to absolute path

  return objectMap(actionCoreMap, (actionFunc, actionType) => async (store, {
    key, // relative path
    keyTo, // relative path, OPTIONAL
    batchList = [ '' ] // default will be: `[ '' ]`, for simple batch action, will append path after key/keyTo
  }) => { // key/keyTo must be under rootPath
    loggerExot.add(`[ActionBox|${actionType}] ${key || ''}${keyTo ? `, ${keyTo}` : ''} (${batchList.join('|')})`)
    const resultList = []
    const errorList = []
    for (const extraPath of batchList) {
      const absolutePath = calcPath(key, extraPath)
      const absolutePathTo = keyTo && calcPath(keyTo, extraPath)
      __DEV__ && console.log('[ActionBox]', actionType, { key, keyTo, absolutePath, absolutePathTo })
      const { result, error } = await catchAsync(actionFunc, absolutePath, absolutePathTo) // NOTE: the call pattern
      const response = { actionType, key, keyTo, ...result }
      error ? errorList.push({ ...response, error: String(error) }) : resultList.push(response)
    }
    return { resultList, errorList }
  })
}

export {
  ACTION_TYPE, ACTION_CORE_MAP,
  setupActionMap
}
