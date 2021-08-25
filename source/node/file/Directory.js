import {
  getPathTypeFromDirent,
  getDirInfoList,
  getDirInfoTree,
  walkDirInfoTreeAsync,
  walkDirInfoTreeBottomUpAsync,
  copyDirInfoTree,
  renameDirInfoTree,
  deleteDirInfoTree,
  createDirectory,
  copyDirectory,
  deleteDirectory,
  resetDirectory,
  getFileList
} from 'source/node/fs/Directory.js' // TODO: DEPRECATE: import from `node/fs/`

/** @deprecated */ const getPathTypeFromDirentExport = getPathTypeFromDirent // TODO: DEPRECATE
/** @deprecated */ const getDirInfoListExport = getDirInfoList // TODO: DEPRECATE
/** @deprecated */ const getDirInfoTreeExport = getDirInfoTree // TODO: DEPRECATE
/** @deprecated */ const walkDirInfoTreeAsyncExport = walkDirInfoTreeAsync // TODO: DEPRECATE
/** @deprecated */ const walkDirInfoTreeBottomUpAsyncExport = walkDirInfoTreeBottomUpAsync // TODO: DEPRECATE
/** @deprecated */ const copyDirInfoTreeExport = copyDirInfoTree // TODO: DEPRECATE
/** @deprecated */ const renameDirInfoTreeExport = renameDirInfoTree // TODO: DEPRECATE
/** @deprecated */ const deleteDirInfoTreeExport = deleteDirInfoTree // TODO: DEPRECATE
/** @deprecated */ const createDirectoryExport = createDirectory // TODO: DEPRECATE
/** @deprecated */ const copyDirectoryExport = copyDirectory // TODO: DEPRECATE
/** @deprecated */ const deleteDirectoryExport = deleteDirectory // TODO: DEPRECATE
/** @deprecated */ const resetDirectoryExport = resetDirectory // TODO: DEPRECATE
/** @deprecated */ const getFileListExport = getFileList // TODO: DEPRECATE

export {
  getPathTypeFromDirentExport as getPathTypeFromDirent, // TODO: DEPRECATE
  getDirInfoListExport as getDirInfoList, // TODO: DEPRECATE
  getDirInfoTreeExport as getDirInfoTree, // TODO: DEPRECATE
  walkDirInfoTreeAsyncExport as walkDirInfoTreeAsync, // TODO: DEPRECATE
  walkDirInfoTreeBottomUpAsyncExport as walkDirInfoTreeBottomUpAsync, // TODO: DEPRECATE
  copyDirInfoTreeExport as copyDirInfoTree, // TODO: DEPRECATE
  renameDirInfoTreeExport as renameDirInfoTree, // TODO: DEPRECATE
  deleteDirInfoTreeExport as deleteDirInfoTree, // TODO: DEPRECATE
  createDirectoryExport as createDirectory, // TODO: DEPRECATE
  copyDirectoryExport as copyDirectory, // TODO: DEPRECATE
  deleteDirectoryExport as deleteDirectory, // TODO: DEPRECATE
  resetDirectoryExport as resetDirectory, // TODO: DEPRECATE
  getFileListExport as getFileList // TODO: DEPRECATE
}
