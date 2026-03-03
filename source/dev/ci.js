import { resolve } from 'node:path'
import { arch, release, userInfo } from 'node:os'

import { withFallbackResult } from 'source/common/error.js'
import { getPathNpm } from 'source/node/module/Software/npm.js'

const runInfoPatchCombo = ({ RUN, padLog, log }) => {
  padLog('Log info')
  log(`system: ${process.platform}-${release()}[${arch()}]`)
  const { username = '???', uid = process.getuid(), gid = process.getgid() } = withFallbackResult({}, userInfo) // may throw in docker with uid-only-user: `SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOENT`
  log(`user: ${username} [${uid}-${gid}]`)
  log(`node: ${process.version}`)
  log(`npm: ${require(resolve(getPathNpm(), './package.json')).version}`)
  log(`with: ${[ '@dr-js/core', '@dr-js/dev' ].map((v) => `${v}@${require(`${v}/package.json`).version}`).join(', ')}`)

  if (process.platform === 'win32') {
    padLog('Patch git') // fix win32 CI cause `something to commit` test error: https://github.com/actions/checkout/issues/135#issuecomment-602171132
    RUN('git config core.autocrlf false')
    RUN('git config core.eol lf')
    RUN('git rm --cached -r .') // reset Git index, `rm .git/index` also work, check: https://stackoverflow.com/questions/5787937/git-status-shows-files-as-changed-even-though-contents-are-the-same/41041699#41041699
    RUN('git reset --hard')
  }
}

export {
  runInfoPatchCombo
}
