import { isBasicObject, isString } from 'source/common/check.js'
import { dupJSON } from 'source/common/data/function.js'
import { objectSortKey } from 'source/common/mutable/Object.js'

const PACKAGE_KEY_SORT_REQUIRED = [
  'bundledDependencies',
  'peerDependencies',
  'dependencies',
  'devDependencies',
  'optionalDependencies'
]

const PACKAGE_KEY_ORDER = [
  'private',
  'name', 'version', 'description',
  'author', 'contributors', 'maintainers',
  'license', 'keywords',
  'repository', 'homepage', 'bugs',
  'main', 'bin', 'browser',
  'man', 'files', 'directories',
  'scripts',
  'config', 'publishConfig',
  'os', 'cpu', 'engines', 'engineStrict',
  ...PACKAGE_KEY_SORT_REQUIRED
]
const getPackageKeyOrder = (key) => {
  const index = PACKAGE_KEY_ORDER.indexOf(key)
  return index === -1 ? PACKAGE_KEY_ORDER.length : index
}

const sortPackageJSON = (packageJSON) => {
  packageJSON = dupJSON(packageJSON)
  PACKAGE_KEY_SORT_REQUIRED.forEach((key) => { packageJSON[ key ] && objectSortKey(packageJSON[ key ]) })
  objectSortKey(packageJSON, (a, b) => getPackageKeyOrder(a) - getPackageKeyOrder(b))
  return packageJSON
}
const packPackageJSON = (packageJSON) => `${JSON.stringify(packageJSON, null, 2)}\n` // npm will add extra `\n` to the output

const toPackageInfo = ({
  packageJSON,
  packageJSONPath = '', packageRootPath = ''
}) => ({
  sourcePackageJSON: dupJSON(packageJSON), // backup, do not edit
  packageJSON, // allow edit
  packageJSONPath, packageRootPath
})

const collectDependency = (packageInfo, {
  dependencyMap = {},
  dependencyInfoMap = {},
  duplicateInfoList = []
} = {}) => { // allow merge multiple package
  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
    optionalDependencies = {}
  } = packageInfo.packageJSON
  for (const dependencyObject of [
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies
  ]) {
    for (const [ name, versionSpec ] of Object.entries(dependencyObject)) {
      if (dependencyInfoMap[ name ]) duplicateInfoList.push({ name, versionSpec, packageInfo, existPackageInfo: dependencyInfoMap[ name ] })
      else {
        dependencyMap[ name ] = versionSpec
        dependencyInfoMap[ name ] = { name, versionSpec, packageInfo }
      }
    }
  }
  return { dependencyMap, dependencyInfoMap, duplicateInfoList }
}

// NOTE: mostly for getting data from installed "node_modules/*/package.json",
//   `npm install` will re-format "bin" to object, but `npm ci` will keep it as-is (npm@6.14)
const getFirstBinPath = (packageJSON) =>
  isString(packageJSON[ 'bin' ]) ? packageJSON[ 'bin' ]
    : isBasicObject(packageJSON[ 'bin' ]) ? Object.values(packageJSON[ 'bin' ])[ 0 ] // choose first path
      : undefined

const parsePackageNameAndVersion = (nameAndVersion) => {
  const nameAndVersionList = nameAndVersion.split('@')
  if (nameAndVersionList.length < 2) return []
  const version = nameAndVersionList.pop()
  const name = nameAndVersionList.join('@')
  if (!name || !version) return []
  return [ name, version ]
}

// check: https://github.com/npm/cli/blob/v6.14.5/lib/pack.js#L67-L71
const toPackageTgzName = (name, version) => `${
  name[ 0 ] === '@' ? name.substr(1).replace(/\//g, '-') : name
}-${
  version
}.tgz`

export {
  sortPackageJSON, packPackageJSON,
  toPackageInfo,
  collectDependency,
  getFirstBinPath,
  parsePackageNameAndVersion,
  toPackageTgzName
}
