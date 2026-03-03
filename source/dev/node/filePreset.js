import { FILTER_SOURCE_JS_FILE } from './preset.js'
import { getFileListFromPathList } from './file.js'

const getSourceJsFileListFromPathList = async (
  pathList,
  resolvePath,
  filterFile = FILTER_SOURCE_JS_FILE
) => getFileListFromPathList(pathList, resolvePath, filterFile)

export { getSourceJsFileListFromPathList }
