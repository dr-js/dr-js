const { runKit } = require('@dr-js/core/library/node/kit.js')
const { runInfoPatchCombo } = require('@dr-js/dev/library/ci.js')

runKit(async (kit) => {
  runInfoPatchCombo(kit)

  kit.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  kit.RUN_SUDO_NPM([ 'config', '--global', 'set', 'cache', kit.fromHome('.npm/') ])

  kit.padLog('Patch install "@dr-js/core" & "@dr-js/dev" & "@min-pack/npm" globally')
  kit.RUN_SUDO_NPM('install --no-fund --no-audit --global @dr-js/core@0.4 @dr-js/dev@0.4 @min-pack/npm@0.1')
}, { title: 'ci-patch' })
