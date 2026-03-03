import { resolve } from 'node:path'

import { isString } from 'source/common/check.js'
import { describe } from 'source/common/format.js'
import { getSample } from 'source/common/math/sample.js'
import { STAT_ERROR, getPathLstat } from 'source/node/fs/Path.js'
import { getDirInfoList, getFileList } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'

import { compressGzBrFileAsync } from 'source/node/module/Archive/function.js'

const DEFAULT_RESOLVE_PATH = (path) => path

const getFileListFromPathList = async (
  pathList = [],
  resolvePath = DEFAULT_RESOLVE_PATH,
  filterFile
) => {
  let resultFileList = []
  for (const path of pathList) resultFileList = resultFileList.concat(await getFileList(resolvePath(path)))
  if (filterFile) resultFileList = resultFileList.filter(filterFile)
  return resultFileList
}

const findPathFragList = async (root, pathFragList = []) => {
  const foundFragList = [ root ]
  while (pathFragList.length) {
    const frag = pathFragList.shift() // TODO: currently mutating the pathFragList
    let foundFrag
    if (isString(frag)) {
      if (REGEXP_FRAG.test(frag)) throw new Error(`invalid frag: ${frag}`)
      if (STAT_ERROR !== await getPathLstat(resolve(...foundFragList, frag))) foundFrag = frag
    } else if (frag instanceof RegExp) {
      const { name } = (await getDirInfoList(resolve(...foundFragList))).find(({ name }) => frag.test(name)) || {}
      if (name) foundFrag = name
    } else throw new Error(`unsupported frag type: ${describe(frag)}`)
    if (foundFrag === undefined) return undefined // end search, no match
    foundFragList.push(foundFrag)
  }
  return resolve(...foundFragList)
}
const REGEXP_FRAG = /^[/\\]/

// for remove dup before zip/packing
// given a list of file, return which file should keep, and which is just pre-compressed dup
const filterPrecompressFileList = (
  fileList,
  regexpCompress = /\.(js|json|txt|md|html|css|xml|wasm|svg|ico|otf|ttf|eot)$/ // common compressible web file extensions
) => {
  const sourceFileList = [] // should be source file
  const sourceCompressList = [] // should be compressible, by extension
  const precompressFileList = [] // just pre-compressed dup
  const fileSet = new Set(fileList)
  for (const file of fileList) {
    if (
      /\.(gz|br)$/.test(file) && // is compressed naming
      fileSet.has(file.slice(0, -3)) // exist source with dropped ".gz|br" extension
    ) {
      precompressFileList.push(file)
      continue
    }
    sourceFileList.push(file)
    regexpCompress.test(file) && sourceCompressList.push(file)
  }
  return {
    sourceFileList,
    sourceCompressList,
    precompressFileList,
    isSkipBr: false // allow change later
  }
}
const generatePrecompressForPath = async (
  path, filterResult,
  jobPoolSize = 4 // Nodejs `UV_THREADPOOL_SIZE` default to 4, and zlib should use all these internal threadpool for this to finish ASAP, set to 1 to avoid CPU hogging
) => { // will overwrite existing precompressFile to prevent stale content being kept
  filterResult = filterResult || filterPrecompressFileList(await getFileList(path))
  const { sourceCompressList, isSkipBr = false } = filterResult
  const jobList = []
  for (const file of sourceCompressList) {
    jobList.push(() => compressGzBrFileAsync(file, `${file}.gz`))
    isSkipBr || jobList.push(() => compressGzBrFileAsync(file, `${file}.br`))
  }
  const getJob = () => {
    if (jobList.length === 0) return
    const func = jobList.pop()
    return func().then(getJob)
  }
  await Promise.all(getSample(() => getJob(), jobPoolSize))
  return filterResult
}
const trimPrecompressForPath = async (path, filterResult) => {
  filterResult = filterResult || filterPrecompressFileList(await getFileList(path))
  const { precompressFileList } = filterResult
  for (const file of precompressFileList) await modifyDelete(file)
  return filterResult
}

export {
  getFileListFromPathList,
  findPathFragList,

  filterPrecompressFileList,
  generatePrecompressForPath, trimPrecompressForPath
}
