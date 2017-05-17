import nodeModuleFs from 'fs'
import nodeModulePath from 'path'

const FILE_TYPE = {
  File: 'File',
  Directory: 'Directory',
  SymbolicLink: 'SymbolicLink', // tricky

  Other: 'Other',
  Error: 'Error' // non-exist or other reason
}

const MODIFY_OPERATION_TYPE = {
  MOVE: 'MOVE',
  COPY: 'COPY',
  DELETE: 'DELETE'
}

function getPathTypeSync (path) {
  try {
    const stat = nodeModuleFs.lstatSync(path)
    return stat.isDirectory() ? FILE_TYPE.Directory
      : stat.isFile() ? FILE_TYPE.File
        : stat.isSymbolicLink() ? FILE_TYPE.SymbolicLink
          : FILE_TYPE.Other
  } catch (error) {
    return FILE_TYPE.Error
  }
}

function createDirectorySync (path) {
  const dirPath = nodeModulePath.resolve(path)
  const upperDirPath = nodeModulePath.dirname(dirPath)
  getPathTypeSync(upperDirPath) !== FILE_TYPE.Directory && createDirectorySync(upperDirPath)
  getPathTypeSync(dirPath) !== FILE_TYPE.Directory && nodeModuleFs.mkdirSync(dirPath)
}

function readFileSync (path) {
  const fd = nodeModuleFs.openSync(path, 'r')
  const stat = nodeModuleFs.fstatSync(fd)
  const buffer = Buffer.alloc(stat.size)
  nodeModuleFs.readSync(fd, buffer, 0, stat.size, 0)
  nodeModuleFs.closeSync(fd)
  return buffer
}

function writeFileSync (path, buffer, mode) {
  const fd = nodeModuleFs.openSync(path, 'w', mode)
  nodeModuleFs.writeSync(fd, buffer, 0, buffer.length)
  nodeModuleFs.closeSync(fd)
  return buffer
}

const BUFFER_LENGTH = 64 * 1024
function copyFileSync (pathFrom, pathTo) {
  const buffer = Buffer.alloc(BUFFER_LENGTH)
  const fdFrom = nodeModuleFs.openSync(pathFrom, 'r')
  const stat = nodeModuleFs.fstatSync(fdFrom)
  const fdTo = nodeModuleFs.openSync(pathTo, 'w', stat.mode)
  let bytesRead = stat.size
  let pos = 0
  while (bytesRead > 0) {
    bytesRead = nodeModuleFs.readSync(fdFrom, buffer, 0, BUFFER_LENGTH, pos)
    nodeModuleFs.writeSync(fdTo, buffer, 0, bytesRead)
    pos += bytesRead
  }

  nodeModuleFs.closeSync(fdFrom)
  nodeModuleFs.closeSync(fdTo)
}

// NOT deep delete
function deletePath (pathType, path) {
  __DEV__ && console.log('[deletePath]', arguments)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return nodeModuleFs.unlinkSync(path)
    case FILE_TYPE.Directory:
      return nodeModuleFs.rmdirSync(path)
  }
  console.log('[deletePath] strange path type', pathType)
}

// NOT deep move
function movePath (pathType, pathFrom, pathTo) {
  __DEV__ && console.log('[movePath]', arguments)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
    case FILE_TYPE.Directory:
      return nodeModuleFs.renameSync(pathFrom, pathTo)
  }
  console.log('[movePath] strange path type', pathType)
}

// NOT deep copy
function copyPath (pathType, pathFrom, pathTo) {
  __DEV__ && console.log('[copyPath]', arguments)
  if (getPathTypeSync(pathTo) === pathType) console.log('[copyPath] exist, skipped')
  if (getPathTypeSync(pathTo) === pathType) return
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return copyFileSync(pathFrom, pathTo)
    case FILE_TYPE.Directory:
      return nodeModuleFs.mkdirSync(pathTo)
  }
  console.log('[copyPath] strange path type', pathType)
}

function modifyFile (operationType, pathType, pathFrom, pathTo) {
  pathType = pathType || getPathTypeSync(pathFrom)
  switch (operationType) {
    case MODIFY_OPERATION_TYPE.COPY:
      createDirectorySync(nodeModulePath.dirname(pathTo))
      return copyPath(pathType, pathFrom, pathTo)
    case MODIFY_OPERATION_TYPE.MOVE:
      createDirectorySync(nodeModulePath.dirname(pathTo))
      return movePath(pathType, pathFrom, pathTo)
    case MODIFY_OPERATION_TYPE.DELETE:
      return deletePath(pathType, pathFrom)
    default:
      throw new Error('[modify] Error operationType:' + operationType)
  }
}

export {
  FILE_TYPE,
  MODIFY_OPERATION_TYPE,
  getPathTypeSync,
  createDirectorySync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  deletePath,
  movePath,
  copyPath,
  modifyFile
}
