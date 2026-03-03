import { resolve } from 'node:path'

import { readJSON } from 'source/node/fs/File.js'
import { existPath } from 'source/node/fs/Path.js'
import { runGit, getGitCommitMessage } from 'source/node/module/Software/git.js'

import {
  writePackageJSON,
  loadPackageInfo, savePackageInfo
} from 'source/node/module/PackageJSON.js'

const doVersionBump = async ({
  packageInfo,
  bumpFunc = async (version, ...bumpArgList) => version,
  bumpArgList = [],
  isGitCommit = false,
  isLongCommitText = false,
  log
}) => {
  const { packageJSON, packageRootPath } = packageInfo
  log && log(`- version: ${packageJSON.version} (pre)`)
  packageJSON.version = await bumpFunc(packageJSON.version, ...bumpArgList)
  log && log(`- version: ${packageJSON.version} (post)`)
  await savePackageInfo(packageInfo)
  let pathPackageLock = resolve(packageRootPath, 'package-lock.json')
  if (await existPath(pathPackageLock)) {
    log && log('- update "package-lock.json"')
    const packageLockJSON = await readJSON(pathPackageLock)
    packageLockJSON.version = packageJSON.version
    try { packageLockJSON[ 'packages' ][ '' ].version = packageJSON.version } catch (error) {} // for lockfile v3
    await writePackageJSON(pathPackageLock, packageLockJSON)
  } else pathPackageLock = ''
  if (isGitCommit) {
    log && log('- commit to git')
    await runGit([ 'add', 'package.json', pathPackageLock && 'package-lock.json' ].filter(Boolean), { cwd: packageRootPath }).promise
    const packageTag = `${packageJSON.name}@${packageJSON.version}`
    const commitArgList = isLongCommitText
      ? [ '-m', packageTag, '-m', COMMIT_MESSAGE_CONTENT ]
      : [ '-m', `VERSION: ${packageTag}` ]
    await runGit([ 'commit', ...commitArgList ], { cwd: packageRootPath }).promise
  }
}

const COMMIT_MESSAGE_WIP_MARK = '[WIP]'
const COMMIT_MESSAGE_CHG_MARK = 'notable change:'
const COMMIT_MESSAGE_CONTENT = [
  COMMIT_MESSAGE_WIP_MARK,
  COMMIT_MESSAGE_CHG_MARK,
  '- break: use `NEW` instead of `OLD`',
  '- deprecate: `OLD`, use `NEW`',
  '- fix: some strange bug in `PATH`',
  '- add: `FUNC` to `PATH`',
  '- script sort',
  '- package update'
].join('\n')

const getCommonVersionBump = (pathRoot = './', isGitCommit, isLongCommitText, log) => async (bumpFunc, ...bumpArgList) => ({
  packageInfo: await loadPackageInfo(pathRoot),
  bumpFunc, bumpArgList, isGitCommit, isLongCommitText, log
})

const doVersionBumpCheckWIP = () => {
  const commitMessage = getGitCommitMessage()
  if (commitMessage.includes(COMMIT_MESSAGE_WIP_MARK)) throw new Error(`found "${COMMIT_MESSAGE_WIP_MARK}" in commit: \n${commitMessage}`)
  if (!commitMessage.includes(COMMIT_MESSAGE_CHG_MARK)) throw new Error(`expect "${COMMIT_MESSAGE_CHG_MARK}" in commit: \n${commitMessage}`)
}

export {
  doVersionBump, getCommonVersionBump,
  doVersionBumpCheckWIP
}
