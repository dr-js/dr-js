import {
  STAT_ERROR,
  PATH_TYPE,
  getPathTypeFromStat,
  getPathLstat,
  getPathStat,
  copyPath,
  renamePath,
  deletePath,
  existPath,
  nearestExistPath,
  toPosixPath,
  dropTrailingSep,
  createPathPrefixLock
} from 'source/node/fs/Path.js' // TODO: DEPRECATE: import from `node/fs/`

/** @deprecated */ const STAT_ERROR_EXPORT = STAT_ERROR // TODO: DEPRECATE
/** @deprecated */ const PATH_TYPE_EXPORT = PATH_TYPE // TODO: DEPRECATE
/** @deprecated */ const getPathTypeFromStatExport = getPathTypeFromStat // TODO: DEPRECATE
/** @deprecated */ const getPathLstatExport = getPathLstat // TODO: DEPRECATE
/** @deprecated */ const getPathStatExport = getPathStat // TODO: DEPRECATE
/** @deprecated */ const copyPathExport = copyPath // TODO: DEPRECATE
/** @deprecated */ const renamePathExport = renamePath // TODO: DEPRECATE
/** @deprecated */ const deletePathExport = deletePath // TODO: DEPRECATE
/** @deprecated */ const existPathExport = existPath // TODO: DEPRECATE
/** @deprecated */ const nearestExistPathExport = nearestExistPath // TODO: DEPRECATE
/** @deprecated */ const toPosixPathExport = toPosixPath // TODO: DEPRECATE
/** @deprecated */ const dropTrailingSepExport = dropTrailingSep // TODO: DEPRECATE
/** @deprecated */ const createPathPrefixLockExport = createPathPrefixLock // TODO: DEPRECATE

export {
  STAT_ERROR_EXPORT as STAT_ERROR, // TODO: DEPRECATE
  PATH_TYPE_EXPORT as PATH_TYPE, // TODO: DEPRECATE
  getPathTypeFromStatExport as getPathTypeFromStat, // TODO: DEPRECATE
  getPathLstatExport as getPathLstat, // TODO: DEPRECATE
  getPathStatExport as getPathStat, // TODO: DEPRECATE
  copyPathExport as copyPath, // TODO: DEPRECATE
  renamePathExport as renamePath, // TODO: DEPRECATE
  deletePathExport as deletePath, // TODO: DEPRECATE
  existPathExport as existPath, // TODO: DEPRECATE
  nearestExistPathExport as nearestExistPath, // TODO: DEPRECATE
  toPosixPathExport as toPosixPath, // TODO: DEPRECATE
  dropTrailingSepExport as dropTrailingSep, // TODO: DEPRECATE
  createPathPrefixLockExport as createPathPrefixLock // TODO: DEPRECATE
}
