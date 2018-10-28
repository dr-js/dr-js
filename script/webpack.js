import { resolve as resolvePath } from 'path'
import { DefinePlugin } from 'webpack'

import { createDirectory } from 'source/node/file/File'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { compileWithWebpack } from 'dev-dep-tool/library/webpack'
import { getLogger } from 'dev-dep-tool/library/logger'

const PATH_ROOT = resolvePath(__dirname, '..')
const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

runMain(async (logger) => {
  const mode = argvFlag('development', 'production') || 'production'
  const isWatch = argvFlag('watch')
  const isProduction = mode === 'production'

  const profileOutput = argvFlag('profile') ? fromRoot('.temp-gitignore/profile-stat.json') : null
  profileOutput && await createDirectory(fromRoot('.temp-gitignore'))

  const babelOption = {
    configFile: false,
    babelrc: false,
    cacheDirectory: isProduction,
    presets: [ [ '@babel/env', { targets: { node: '8.8' }, modules: false } ] ],
    plugins: [
      // NOTE: for Edge(17.17134) support check: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#Spread_in_object_literals
      isProduction && [ '@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true } ]
    ].filter(Boolean)
  }

  const config = {
    mode,
    bail: isProduction,
    output: { path: fromOutput('library'), filename: '[name].js', library: 'Dr', libraryTarget: 'umd' },
    entry: { 'Dr.browser': 'source/Dr.browser' },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: babelOption } } ] },
    plugins: [ new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode), __DEV__: !isProduction }) ]
  }

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, logger })
}, getLogger(`webpack`, argvFlag('quiet')))
