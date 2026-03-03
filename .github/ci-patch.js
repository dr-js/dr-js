const { runKit } = require('@dr-js/core/library/node/kit.js')
const { runInfoPatchCombo } = require('@dr-js/dev/library/ci.js')

runKit(async (kit) => {
  runInfoPatchCombo(kit)

  // kit.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  // kit.RUN_SUDO_NPM([ 'config', '--global', 'set', 'cache', kit.fromHome('.npm/') ])

  kit.RUN('npm ci --ignore-scripts')
  kit.RUN('npm explore puppeteer -- npm run postinstall')

  // TODO: check installed pptr
  // const pptrConf = require('puppeteer/lib/cjs/puppeteer/getConfiguration.js').getConfiguration()
  // kit.log('puppeteer:getConfiguration', JSON.stringify(pptrConf, null, 2))
  // kit.log('@puppeteer/browsers:getInstalledBrowsers', JSON.stringify(await require('@puppeteer/browsers').getInstalledBrowsers({ cacheDir: pptrConf.cacheDirectory }), null, 2))
}, { title: 'ci-patch' })
