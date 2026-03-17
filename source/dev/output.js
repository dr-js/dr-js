import { ok } from 'node:assert'
import { statSync } from 'node:fs'
import { binary, describe } from 'source/common/format.js'
import { indentLineList } from 'source/common/string.js'
import { getFirstBinPath, toPackageTgzName } from 'source/common/module/PackageJSON.js'
import { parseSemVer } from 'source/common/module/SemVer.js'
import { readTextSync, writeTextSync, readJSONSync, writeJSONSync } from 'source/node/fs/File.js'
import { getFileList, resetDirectory } from 'source/node/fs/Directory.js'
import { modifyCopy, modifyRename, modifyDelete } from 'source/node/fs/Modify.js'
import { runStdout } from 'source/node/run.js'

import { runNpm } from 'source/node/module/Software/npm.js'
import { runGitStdout, runGitStdoutSync } from 'source/node/module/Software/git.js'

import { FILTER_TEST_PATH } from './node/preset.js'
import { getFileListFromPathList } from './node/file.js'
import { writeLicenseFile } from './license.js'

const initOutput = async ({
  kit, kitLogger = kit,
  fromOutput = kit && kit.fromOutput,
  fromRoot = kit && kit.fromRoot,

  deleteKeyList = [ 'private', 'scripts', 'devExecCommands', 'devDependencies' ],
  extraDeleteKeyList = [], // append to `deleteKeyList`
  extraEntryMap = {},
  editPackageJSON = async (packageJSON) => {},
  copyPathList = [ 'README.md' ],
  copyMapPathList = [],
  replaceReadmeNonPackageContent = '\n\nmore in source `README.md`', // set to false to skip
  pathAutoLicenseFile = 'LICENSE' // set to false, or do not set `packageJSON.license` to skip
}) => {
  kitLogger.padLog('reset output')
  await resetDirectory(fromOutput())

  kitLogger.padLog('init output package.json')
  const packageJSON = readJSONSync(fromRoot('package.json'))
  for (const deleteKey of [ ...deleteKeyList, ...extraDeleteKeyList ]) {
    kitLogger.log(`dropped key: ${deleteKey}`)
    delete packageJSON[ deleteKey ]
  }
  for (const [ key, value ] of Object.entries(extraEntryMap)) {
    if (packageJSON[ key ] !== undefined) kitLogger.log(`changed key: ${key} (from ${describe(packageJSON[ key ])} to ${describe(value)})`)
    else kitLogger.log(`added key: ${key} (${describe(value)})`)
    packageJSON[ key ] = value
  }
  await editPackageJSON(packageJSON)
  writeJSONSync(fromOutput('package.json'), packageJSON)

  const { license, author } = packageJSON
  if (pathAutoLicenseFile && license && author) {
    kitLogger.padLog('update source license file')
    writeLicenseFile(fromRoot(pathAutoLicenseFile), license, author)
    copyPathList.push(pathAutoLicenseFile)
  }

  kitLogger.padLog('init output file')
  for (const [ pathFrom, pathTo ] of [ ...copyPathList.map((v) => [ v, v ]), ...copyMapPathList ]) {
    if (replaceReadmeNonPackageContent && pathFrom.endsWith('README.md')) { // change README.md NON_PACKAGE_CONTENT
      const packageContentList = readTextSync(fromRoot(pathFrom)).split('[//]: # (NON_PACKAGE_CONTENT)')
      if (packageContentList.length >= 2) {
        writeTextSync(fromOutput(pathTo), `${packageContentList[ 0 ].trim()}${replaceReadmeNonPackageContent}`)
        kitLogger.log(`copied: ${pathFrom} (with NON_PACKAGE_CONTENT replaced to: ${JSON.stringify(replaceReadmeNonPackageContent)})`)
        continue
      }
    }
    await modifyCopy(fromRoot(pathFrom), fromOutput(pathTo))
    kitLogger.log(`copied: ${pathFrom}`)
  }

  return packageJSON
}

const packOutput = async ({
  kit, kitLogger = kit,
  fromOutput = kit && kit.fromOutput,
  fromRoot = (kit && kit.fromRoot) || fromOutput, // OPTIONAL, for move output .tgz file to root

  cwd = fromOutput(),
  packageJSON = readJSONSync(fromOutput('package.json'))
}) => {
  kitLogger.padLog('run pack output')
  await runNpm([ '--no-update-notifier', 'pack' ], { cwd, quiet: !kitLogger.isVerbose }).promise

  const packName = toPackageTgzName(packageJSON.name, packageJSON.version)
  if (fromRoot() !== cwd) {
    kitLogger.log('move to root path')
    await modifyRename(fromOutput(packName), fromRoot(packName))
  }
  kitLogger.padLog(`pack size: ${binary(statSync(fromRoot(packName)).size)}B`)

  return fromRoot(packName)
}

const clearOutput = async ({
  kit, kitLogger = kit,
  fromOutput = kit && kit.fromOutput,

  pathList = [ '.' ],
  filterFile = FILTER_TEST_PATH
}) => {
  if (!fromOutput) throw new Error('[clearOutput] expect fromOutput')
  kitLogger.padLog('clear output')
  const fileList = await getFileListFromPathList(pathList, fromOutput, filterFile)
  for (const filePath of fileList) await modifyDelete(filePath) // NOTE: will keep empty test folder
}

const verifyOutputBin = async ({
  kit, kitLogger = kit,
  fromOutput = kit && kit.fromOutput,

  cwd = fromOutput(),
  versionArgList = [ '--version' ], // DEFAULT: request version
  packageJSON: { name, version, bin },
  pathExe = process.execPath, // allow set to '' to skip, or use other non-node executable
  matchStringList = [ name, version ] // DEFAULT: expect output with full package name & version
}) => {
  const pathBin = getFirstBinPath({ bin })
  kitLogger.padLog(`verify output bin working: "${pathBin}"`)
  const outputBinTest = String(await runStdout([ pathExe, pathBin, ...versionArgList ].filter(Boolean), { cwd }))
  kitLogger.log(`bin test output: ${outputBinTest}`)
  for (const testString of matchStringList) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

const verifyNoGitignore = async ({
  path,
  kit, kitLogger = kit
}) => {
  kitLogger.padLog('verify no gitignore file left')
  const badFileList = (await getFileList(path)).filter((path) => path.includes('gitignore'))
  badFileList.length && kitLogger.log(`found gitignore file:\n${indentLineList(badFileList, '  - ')}`)
  ok(badFileList.length === 0, `${badFileList.length} gitignore file found`)
}

const verifyGitStatusClean = async ({
  kit, kitLogger = kit,
  fromRoot = kit && kit.fromRoot,

  cwd = fromRoot(),
  extraArgList = [] // mostly set path to check
}) => {
  kitLogger.padLog('verify git has nothing to commit')
  // https://stackoverflow.com/questions/5143795/how-can-i-check-in-a-bash-script-if-my-local-git-repository-has-changes/25149786#25149786
  if (String(await runGitStdout([ 'status', '--porcelain', ...extraArgList ], { cwd })) !== '') throw new Error(`[verifyGitStatusClean] change to commit:\n${runGitStdoutSync([ 'status', '-vv', ...extraArgList ], { cwd })}`)
}

const verifyPackageVersionStrict = (packageVersion) => { // allow only major or dev version
  const { label } = parseSemVer(packageVersion)
  if (
    !label || // 0.0.0
    /^-dev\.\d+$/.test(label) // 0.0.0-dev.0
  ) return
  throw new Error(`[verifyPackageVersionStrict] invalid version: ${packageVersion}`)
}
const publishPackage = async ({
  packageJSON: { name, version },
  pathPackagePack, // the .tgz output of pack
  extraArgs = [],
  tag = parseSemVer(version).label ? 'dev' : 'latest', // default to `latest` for major version, `dev` for other labeled version
  isAccessRestricted = false, // default to public access for scoped package
  kit, kitLogger = kit
}) => {
  kitLogger.padLog(`publish package: ${version} (${tag})`)
  !extraArgs.includes('--tag') && extraArgs.push('--tag', tag) // Patch tag
  !extraArgs.includes('--access') && name.startsWith('@') && extraArgs.push('--access', isAccessRestricted ? 'restricted' : 'public') // Patch for scoped packages, check: https://docs.npmjs.com/cli/publish
  // NOTE: if this process is run under yarn, the registry will be pointing to `https://registry.yarnpkg.com/`, and auth for publish will not work, check:
  // - `npm config get userconfig`
  // - `npm config get registry`
  // - `npm whoami`
  await runNpm([ '--no-update-notifier', 'publish', pathPackagePack, ...extraArgs ]).promise
}

export {
  initOutput, packOutput, clearOutput,

  verifyOutputBin,
  verifyNoGitignore, verifyGitStatusClean,
  verifyPackageVersionStrict,

  publishPackage
}
