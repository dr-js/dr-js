import nodeModuleFs from 'fs'
import nodeModulePath from 'path'

import {
  FILE_TYPE,
  MODIFY_OPERATION_TYPE,
  getPathTypeSync,
  createDirectorySync,
  deletePath,
  movePath,
  copyPath,
  modifyFile
} from './FileOperation'

const WALK_CONTROL_TYPE = {
  CONTINUE: 'CONTINUE',
  BREAK: 'BREAK'
}

class Directory {
  constructor (path) {
    this.path = ''
    this.content = null
    path && this.readContent(path)
  }

  readContent (path) {
    if (getPathTypeSync(path) !== FILE_TYPE.Directory) throw new Error(`[DirectoryOperation] Error! path not Directory: ${path}`)
    const content = {
      [ FILE_TYPE.Directory ]: new Map(), // name - sub Directory
      [ FILE_TYPE.File ]: [],
      [ FILE_TYPE.SymbolicLink ]: [],
      [ FILE_TYPE.Other ]: []
    }
    nodeModuleFs.readdirSync(path).forEach((name) => {
      const subPath = nodeModulePath.join(path, name)
      const subPathType = getPathTypeSync(subPath)
      switch (subPathType) {
        case FILE_TYPE.Directory:
          content[ subPathType ].set(name, new this.constructor(subPath))
          break
        case FILE_TYPE.File:
        case FILE_TYPE.SymbolicLink:
          content[ subPathType ].push(name)
          break
        default:
          content[ FILE_TYPE.Other ].push(name)
          break
      }
    })
    this.path = path
    this.content = content
    return content
  }

  walk (callback, isCallbackFirst) {
    [ FILE_TYPE.File, FILE_TYPE.SymbolicLink, FILE_TYPE.Other ].forEach((type) => {
      const nameList = this.content[ type ]
      for (let name of nameList) {
        const walkControl = callback(this.path, name, type)
        if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue // skip current (should be sub Directory + is_call_before_walk == false)
        if (walkControl === WALK_CONTROL_TYPE.BREAK) break // skip current content type
      }
    })
    const subDirectoryMap = this.content[ FILE_TYPE.Directory ]
    for (let [ name, subDirectory ] of subDirectoryMap) {
      !isCallbackFirst && subDirectory.walk(callback, isCallbackFirst)
      const walkControl = callback(this.path, name, FILE_TYPE.Directory)
      if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue // skip current (should be sub Directory + is_call_before_walk == false)
      if (walkControl === WALK_CONTROL_TYPE.BREAK) break // skip current content type
      isCallbackFirst && subDirectory.walk(callback, isCallbackFirst)
    }
  }

  walkOnce (callback) {
    [ FILE_TYPE.File, FILE_TYPE.SymbolicLink, FILE_TYPE.Other ].forEach((type) => {
      const nameList = this.content[ type ]
      for (let name of nameList) {
        const walkControl = callback(this.path, name, type)
        if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue // skip current (should be sub Directory + is_call_before_walk == false)
        if (walkControl === WALK_CONTROL_TYPE.BREAK) break // skip current content type
      }
    })
    const subDirectoryMap = this.content[ FILE_TYPE.Directory ]
    for (let name of subDirectoryMap) {
      const walkControl = callback(this.path, name, FILE_TYPE.Directory)
      if (walkControl === WALK_CONTROL_TYPE.CONTINUE) continue // skip current (should be sub Directory + is_call_before_walk == false)
      if (walkControl === WALK_CONTROL_TYPE.BREAK) break // skip current content type
    }
  }

  copy (pathTo) {
    createDirectorySync(pathTo)
    const pathToMap = { [ this.path ]: pathTo }
    this.walk((path, name, type) => {
      const pathFrom = nodeModulePath.join(path, name)
      const pathTo = nodeModulePath.join(pathToMap[ path ], name)
      pathToMap[ pathFrom ] = pathTo
      copyPath(type, pathFrom, pathTo)
    }, true)
  }

  move (pathTo) {
    createDirectorySync(pathTo)
    this.walkOnce((path, name, type) => movePath(type, nodeModulePath.join(path, name), nodeModulePath.join(pathTo, name)))
  }

  delete () {
    return this.walk((path, name, type) => deletePath(type, nodeModulePath.join(path, name)), false)
  }
}

/*
 * @{param} path
 * @{param}[optional] fileFilter(path, name) return true to filter
 * @{param}[optional] outputMapper(path, name) return new path
 * if outputMapper, return [ [ sourcePath, mappedPath ] ]
 * if no outputMapper, return [ sourcePath ]
 * */
function getFileList (path, fileFilter, outputMapper) {
  const fileList = []

  function addFile (path, name) {
    if (fileFilter && fileFilter(path, name)) return
    const sourcePath = nodeModulePath.join(path, name)
    outputMapper ? fileList.push([ sourcePath, outputMapper(path, name) ]) : fileList.push(sourcePath)
  }

  switch (getPathTypeSync(path)) {
    case FILE_TYPE.File:
      addFile(nodeModulePath.dirname(path), nodeModulePath.basename(path))
      break
    case FILE_TYPE.Directory:
      (new Directory(path)).walk((path, name, type) => (type === FILE_TYPE.File) && addFile(path, name))
      break
  }
  return fileList
}

function getExtnameFilter (extname) { return (path, name) => (extname !== nodeModulePath.extname(name)) }
function getPrefixMapper (prefix) { return (path, name) => nodeModulePath.join(path, prefix + name) }

// pathTo only needed for copy / move
function modifyDirectory (operationType, pathType, pathFrom, pathTo) {
  pathType = pathType || getPathTypeSync(pathFrom)
  switch (pathType) {
    case FILE_TYPE.Directory:
      const directory = new Directory(pathFrom)
      switch (operationType) {
        case MODIFY_OPERATION_TYPE.COPY:
          return directory.copy(pathTo)
        case MODIFY_OPERATION_TYPE.MOVE:
          directory.move(pathTo)
          return deletePath(FILE_TYPE.Directory, pathFrom)
        case MODIFY_OPERATION_TYPE.DELETE:
          directory.delete(pathTo)
          return deletePath(FILE_TYPE.Directory, pathFrom)
        default:
          throw new Error(`[modify] Error operationType: ${operationType}`)
      }
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return modifyFile(operationType, pathType, pathFrom, pathTo)
  }
}

export {
  WALK_CONTROL_TYPE,
  Directory,
  getFileList,
  getExtnameFilter,
  getPrefixMapper,
  modifyDirectory
}
