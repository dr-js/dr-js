import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack.js'

import { runKit } from 'source/node/kit.js'

import { createWebpackIndexFile, deleteWebpackIndexFile } from './generateSpec.js'

runKit(async (kit) => {
  await createWebpackIndexFile(kit)

  const { mode, isWatch, profileOutput, getCommonWebpackConfig } = await commonFlag({ kit })

  const config = getCommonWebpackConfig({
    output: { path: kit.fromOutput('library'), filename: '[name].js', library: { name: 'Dr', type: 'window' } },
    entry: { 'Dr.browser': 'source/Dr.browser' }
  })

  kit.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, kit })

  !isWatch && await deleteWebpackIndexFile(kit)
}, { title: 'webpack' })
