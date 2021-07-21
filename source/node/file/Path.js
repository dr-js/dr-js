export {
  STAT_ERROR,
  PATH_TYPE,

  getPathTypeFromStat,
  getPathLstat, getPathStat,

  copyPath,
  renamePath,
  deletePath,

  existPath, nearestExistPath,
  toPosixPath, dropTrailingSep,
  createPathPrefixLock
} from 'source/node/fs/Path.js' // TODO: DEPRECATE: import from `node/fs/`
