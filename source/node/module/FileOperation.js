import Dr from 'Dr'

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
  const buffer = new Buffer(stat.size)
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

function copyFileSync (pathFrom, pathTo) {
  const fdFrom = nodeModuleFs.openSync(pathFrom, 'r')
  const fdTo = nodeModuleFs.openSync(pathTo, 'w', stat.mode)

  const BUFFER_LENGTH = 64 * 1024
  const buffer = new Buffer(BUFFER_LENGTH)
  const stat = nodeModuleFs.fstatSync(fdFrom)
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
  Dr.debug(5, '[deletePath]', arguments)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return nodeModuleFs.unlinkSync(path)
    case FILE_TYPE.Directory:
      return nodeModuleFs.rmdirSync(path)
  }
  Dr.log('[deletePath] strange path type', pathType)
}

// NOT deep move
function movePath (pathType, pathFrom, pathTo) {
  Dr.debug(5, '[movePath]', arguments)
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
    case FILE_TYPE.Directory:
      return nodeModuleFs.renameSync(pathFrom, pathTo)
  }
  return Dr.log('[movePath] strange path type', pathType)
}

// NOT deep copy
function copyPath (pathType, pathFrom, pathTo) {
  Dr.debug(5, '[copyPath]', arguments)
  if (getPathTypeSync(pathTo) === pathType) return Dr.log('[copyPath] exist, skipped')
  switch (pathType) {
    case FILE_TYPE.File:
    case FILE_TYPE.SymbolicLink:
      return copyFileSync(pathFrom, pathTo)
    case FILE_TYPE.Directory:
      return nodeModuleFs.mkdirSync(pathTo)
  }
  Dr.log('[copyPath] strange path type', pathType)
}

function modify (operationType, pathType, pathFrom, pathTo) {
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
  modify
}

export default {
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
  modify
}
