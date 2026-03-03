import { join, dirname } from 'node:path'

import { tryRequire } from 'source/env/tryRequire.js'
import { binary, time, padTable } from 'source/common/format.js'
import { writeJSON } from 'source/node/fs/File.js'
import { createDirectory } from 'source/node/fs/Directory.js'
import { addExitListenerAsync } from 'source/node/system/ExitListener.js'
import { argvFlag } from 'source/node/kit.js'

import { getWebpackBabelConfig } from './babel.js'
import { createProgressPlugin } from './webpack-progress-plugin.js'

// https://webpack.js.org/api/stats/

const GET_WEBPACK = (log = console.warn) => {
  const Webpack = tryRequire('webpack')
  if (Webpack) return Webpack
  const error = new Error('[Webpack] failed to load package "webpack"')
  log(error)
  throw error
}

const getStatsCheck = (onError, onStats) => (error, stats) => {
  if (error) return onError(error)
  const isErrorLog = stats.hasErrors()
  const isWarningLog = stats.hasWarnings()
  if (isErrorLog || isWarningLog) {
    const { errors = [], warnings = [] } = stats.toJson({
      all: false, // fallback value for stats options when an option is not defined (has precedence over local webpack defaults)
      errors: true, // Add errors
      errorDetails: true, // Add details to errors (like resolving log)
      warnings: true // Add warnings
    })
    errors.forEach((message) => console.error(message))
    warnings.forEach((message) => console.warn(message))
    if (isErrorLog) return onError(new Error('webpack stats Error'))
  }
  onStats(stats)
}

const getLogStats = (isWatch, kitLogger) => {
  const logSingleStats = (statsData, startTime, endTime) => {
    startTime && endTime && kitLogger.padLog(`[${isWatch ? 'watch' : 'compile'}] time: ${time(endTime - startTime)}`)

    const { assets, chunks } = statsData.toJson({
      all: false, // fallback value for stats options when an option is not defined (has precedence over local webpack defaults)
      assets: true, // Add asset Information
      chunks: kitLogger.isVerbose // Add chunk information (setting this to `false` allows for a less verbose output)
    })

    const table = []
    assets.forEach(({ name, size, emitted }) => table.push([
      `  Asset ${name}`,
      formatSize(size),
      formatTag({ emitted })
    ]))
    kitLogger.isVerbose && chunks.forEach(({ id, names, size, entry, initial, rendered }) => table.push([
      `  Chunk ${id || '-'} ${names.join(',')}`,
      formatSize(size),
      formatTag({ entry, initial, rendered })
    ]))
    kitLogger.log(`output:\n${padTable({ table, padFuncList: [ 'L', 'R', 'L' ] })}`)
  }

  return (stats) => {
    if (stats.compilation) return logSingleStats(stats) // Stats (for single config)
    if (stats.stats) return stats.stats.map(logSingleStats) // MultiStats (for more than one config)
    console.warn('[getLogStats] unexpected statData', stats)
    throw new Error('[getLogStats] unexpected statData')
  }
}
const formatSize = (size) => `${binary(size)}B`
const formatTag = (tagMap) => Object.entries(tagMap).map(([ k, v ]) => v && k).filter(Boolean).join(',')

const compileWithWebpack = async ({
  kit, kitLogger = kit,
  Webpack = GET_WEBPACK(kitLogger.log),

  config, isWatch, profileOutput, namedChunkGroupOutput
}) => {
  if (profileOutput) {
    isWatch && console.warn('[watch] warning: skipped generate profileOutput')
    config.profile = true
  }

  const compiler = Webpack(config)
  const logStats = getLogStats(isWatch, kitLogger)

  if (isWatch) {
    kitLogger.log('[watch] start')
    const watching = compiler.watch({ aggregateTimeout: 512, poll: undefined }, getStatsCheck((error) => kitLogger.log(`error: ${error}`), logStats))
    addExitListenerAsync(async (eventPack) => {
      await new Promise((resolve) => watching.close(resolve))
      kitLogger.log(`[watch] exit with state: ${JSON.stringify(eventPack)}`)
    })
  } else {
    kitLogger.log('[compile] start')
    const stats = await new Promise((resolve, reject) => compiler.run(getStatsCheck(reject, resolve)))
    await new Promise((resolve, reject) => compiler.close((error, result) => error ? reject(error) : resolve(result))) // close for Webpack5
    logStats(stats)
    let statsJSON
    const getStatsJSON = () => {
      if (statsJSON === undefined) statsJSON = stats.toJson('verbose') // all data
      return statsJSON
    }
    if (profileOutput) {
      await createDirectory(dirname(profileOutput))
      await writeJSON(profileOutput, getStatsJSON())
      kitLogger.log(`[compile] generated profileOutput at: ${profileOutput}`)
    }
    if (namedChunkGroupOutput) {
      await createDirectory(dirname(namedChunkGroupOutput))
      const { namedChunkGroups, children } = getStatsJSON() // for MultiStats, should check each Stats in statsJSON.children
      await writeJSON(namedChunkGroupOutput, (
        namedChunkGroups ||
        (children && children.map(({ name, namedChunkGroups }) => ({ name, namedChunkGroups }))) ||
        {}
      ))
      kitLogger.log(`[compile] generated namedChunkGroupOutput at: ${namedChunkGroupOutput}`)
    }
    return stats
  }
}

const commonFlag = async ({
  kit, kitLogger = kit,
  fromRoot = kit && kit.fromRoot, // optional if directly set `profileOutput`
  Webpack = GET_WEBPACK(kitLogger),

  mode = argvFlag('development', 'production') || 'production',
  isWatch = Boolean(argvFlag('watch')),
  isProduction = mode === 'production',
  profileOutput = argvFlag('profile') ? fromRoot('.temp-gitignore/profile-stat.json') : null,
  namedChunkGroupOutput = ''
}) => {
  kitLogger.log(`compile flag: ${JSON.stringify({ mode, isWatch, isProduction, profileOutput, namedChunkGroupOutput }, null, '  ')}`)

  const getCommonWebpackConfig = ({
    babelOption = getWebpackBabelConfig({ isProduction }),
    packageJSONPickOption = { keys: [ 'name', 'version' ], exportMode: 'export-each' }, // prefer style like: `import { a, b } from './package.json'`
    output, // = { path: fromOutput('library'), filename: '[name].js', library: 'LIBRARY', libraryTarget: 'umd' },
    entry, // = { index: 'source/index' },
    resolve = { alias: { source: fromRoot('source') } },
    externals = undefined,
    isNodeEnv = false,
    isNodeBin = false, // add `#!/usr/bin/env node`
    isMinimize = false, // expect later manual run for each file
    extraModuleRuleList = [],
    extraPluginList = [],
    extraDefine = {},
    ...extraConfig
  }) => ({
    mode,
    bail: isProduction,
    target: isNodeEnv ? 'node12' : [ 'web', 'es8' ], // support node main modules like 'fs'
    node: isNodeEnv ? false : undefined, // do not polyfill fake node environment when build for node
    output,
    entry,
    resolve,
    externals,
    module: {
      rules: [
        babelOption && { test: /\.m?js$/, use: { loader: 'babel-loader', options: babelOption } },
        packageJSONPickOption && {
          test: /\/package\.json$/,
          type: (!packageJSONPickOption.exportMode || packageJSONPickOption.exportMode.startsWith('export-')) ? 'javascript/auto' : undefined,
          use: { loader: join(__dirname, 'webpack-json-pick-loader.js'), options: packageJSONPickOption }
        },
        ...extraModuleRuleList
      ].filter(Boolean)
    },
    plugins: [
      createProgressPlugin({ log: kitLogger.log }),
      new Webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
        '__DEV__': !isProduction,
        ...extraDefine
      }),
      isNodeBin && new Webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
      ...extraPluginList
    ].filter(Boolean),
    optimization: { minimize: isMinimize },
    performance: { hints: isMinimize ? 'warning' : false }, // mute: `The following asset(s) exceed the recommended size limit (250 kB).`
    ...extraConfig
  })

  return { mode, isWatch, isProduction, profileOutput, namedChunkGroupOutput, getCommonWebpackConfig }
}

export {
  GET_WEBPACK,
  compileWithWebpack,
  commonFlag
}
