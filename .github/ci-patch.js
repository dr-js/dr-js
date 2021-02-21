const { commonInfoPatchCombo } = require('@dr-js/dev/library/ci')
const { runMain } = require('@dr-js/dev/library/main')

runMain(async (logger) => {
  const { RUN, fromHome, config: { COMMAND_SUDO_NPM } } = commonInfoPatchCombo(logger)

  logger.padLog('Patch npm cache path') // set cache path to `~/.npm/` for all platform (only win32 for now)
  RUN([ ...`${COMMAND_SUDO_NPM} config --global set cache`.split(' '), fromHome('.npm/') ])

  logger.padLog('Patch install "@dr-js/dev" globally')
  RUN(`${COMMAND_SUDO_NPM} install --global @dr-js/dev@0.4`)
}, 'ci-patch')
