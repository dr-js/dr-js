const { runKit } = require('@dr-js/core/library/node/kit.js')
const { runInfoPatchCombo } = require('@dr-js/dev/library/ci.js')

runKit(async (kit) => {
  runInfoPatchCombo(kit)

  kit.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  kit.RUN_SUDO_NPM([ 'config', '--global', 'set', 'cache', kit.fromHome('.npm/') ])

  kit.padLog('Patch install "@dr-js/core" & "@dr-js/dev" & "@min-pack/npm" globally')
  if (process.platform === 'win32' && parseInt(process.versions.node) <= 14) { // HACK: bypass npm@6+win32 `npm ERR! Error: EPERM: operation not permitted, rename` error
    // check: https://github.com/actions/setup-node/issues/411, https://github.com/npm/cli/issues/4341, https://github.com/npm/template-oss/pull/36
    require('@dr-js/core/library/node/fs/Directory.js').createDirectorySync(kit.fromOsTemp('patch-npm-install-global/'))
    kit.RUN('curl -sO https://registry.npmjs.org/npm/-/npm-7.24.2.tgz', { cwd: kit.fromOsTemp('patch-npm-install-global/') })
    kit.RUN('tar xf npm-7.24.2.tgz', { cwd: kit.fromOsTemp('patch-npm-install-global/') })
    kit.RUN('node lib/npm.js install --no-fund --no-audit --global @dr-js/core@0.4 @dr-js/dev@0.4 @min-pack/npm@0.1', { cwd: kit.fromOsTemp('patch-npm-install-global/', 'package/') })
  } else kit.RUN_SUDO_NPM('install --no-fund --no-audit --global @dr-js/core@0.4 @dr-js/dev@0.4 @min-pack/npm@0.1')
}, { title: 'ci-patch' })
