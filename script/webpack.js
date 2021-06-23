import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack.js'
import { runMain, commonCombo } from '@dr-js/dev/module/main.js'

runMain(async (logger) => {
  const { fromRoot, fromOutput } = commonCombo(logger)
  const { mode, isWatch, profileOutput, getCommonWebpackConfig } = await commonFlag({ fromRoot, logger })

  const config = getCommonWebpackConfig({
    output: { path: fromOutput('library'), filename: '[name].js', library: { name: 'Dr', type: 'window' } },
    entry: { 'Dr.browser': 'source/Dr.browser' }
  })

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, logger })
}, 'webpack')
