import { resolve, basename } from 'node:path'
import { sortPackageJSON, packPackageJSON, toPackageInfo, collectDependency } from 'source/common/module/PackageJSON.js'
import { editText, readJSON, writeText } from 'source/node/fs/File.js'
import { getFileList } from 'source/node/fs/Directory.js'

const toPackageJSONPath = (path = process.cwd()) => resolve(...[
  path,
  path.endsWith('package.json') ? '' : 'package.json'
].filter(Boolean))

const toPackageRootPath = (path = process.cwd()) => resolve(...[
  path,
  path.endsWith('package.json') ? '..' : ''
].filter(Boolean))

const writePackageJSON = async (path, packageJSON, isSortKey = false) => writeText(path, packPackageJSON(isSortKey ? sortPackageJSON(packageJSON) : packageJSON))
const editPackageJSON = async (editFunc, pathFrom, pathTo) => editText(async (string) => {
  let packageJSON = JSON.parse(string)
  packageJSON = await editFunc(packageJSON)
  return packPackageJSON(packageJSON)
}, pathFrom, pathTo)

const loadPackageInfo = async (path) => {
  const packageJSONPath = toPackageJSONPath(path)
  return toPackageInfo({
    packageJSON: await readJSON(packageJSONPath),
    packageJSONPath, packageRootPath: toPackageRootPath(packageJSONPath)
  })
}

const loadPackageInfoList = async (pathRoot) => { // path to packageJSON, packageRoot, or folder with many package.json
  const pathPackageJSONList = (await getFileList(pathRoot))
    .filter((path) => basename(path) === 'package.json')

  const packageInfoList = []
  for (const pathPackageJSON of pathPackageJSONList) packageInfoList.push(await loadPackageInfo(pathPackageJSON))
  return packageInfoList
}

const loadPackageCombo = async (pathRoot) => {
  const packageInfoList = await loadPackageInfoList(pathRoot)
  const { dependencyMap, dependencyInfoMap, duplicateInfoList } = packageInfoList.reduce((o, packageInfo) => collectDependency(packageInfo, o), {})
  return {
    packageInfoList,
    dependencyMap, dependencyInfoMap, duplicateInfoList
  }
}

const savePackageInfo = async ({
  packageJSON, packageJSONPath,
  isSortKey = false
}) => writePackageJSON(packageJSONPath, packageJSON, isSortKey)

export {
  toPackageJSONPath, toPackageRootPath,
  writePackageJSON, editPackageJSON,
  loadPackageInfo, loadPackageInfoList, loadPackageCombo,
  savePackageInfo
}
