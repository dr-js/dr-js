const { runKit } = require('@dr-js/core/library/node/kit.js')
const { runInfoPatchCombo } = require('@dr-js/dev/library/ci.js')

runKit(async (kit) => {
  runInfoPatchCombo(kit)

  // kit.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  // kit.RUN_SUDO_NPM([ 'config', '--global', 'set', 'cache', kit.fromHome('.npm/') ])

  // kit.padLog('Patch install "@dr-js/core" & "@dr-js/dev" & "@min-pack/npm" globally')
  // kit.RUN_SUDO_NPM('install --no-fund --no-audit --global @dr-js/core@0.5 @dr-js/dev@0.5 @min-pack/npm@0.1')

  if (parseInt(process.versions.node) <= 14) { // TODO: wait for npm@7 adoption and try npm install + cache for faster puppeteer install
    kit.RUN('npm i -g @min-pack/npm@0.1')
    kit.RUN('npm8 ci --omit=optional')
    return
  }

  kit.RUN('npm ci --omit=optional')
}, { title: 'ci-patch' })
