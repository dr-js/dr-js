const { runKit } = require('@dr-js/core/library/node/kit.js')
const { runInfoPatchCombo } = require('@dr-js/dev/library/ci.js')

runKit(async (kit) => {
  runInfoPatchCombo(kit)

  kit.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  kit.RUN_SUDO_NPM([ 'config', '--global', 'set', 'cache', kit.fromHome('.npm/') ])

  kit.padLog('Patch install "@dr-js/dev" globally')
  kit.RUN_SUDO_NPM('install --global @dr-js/dev@0.4')
}, { title: 'ci-patch' })
