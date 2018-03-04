import { resolve as resolvePath } from 'path'
import { DefinePlugin } from 'webpack'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { compileWithWebpack } from 'dev-dep-tool/library/webpack'
import { getLogger } from 'dev-dep-tool/library/logger'

const PATH_ROOT = resolvePath(__dirname, '..')
const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

runMain(async (logger) => {
  const MODE = argvFlag('development', 'production') || 'production'
  const isWatch = argvFlag('watch')
  const BABEL_OPTIONS = {
    babelrc: false,
    presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ] ],
    plugins: [ [ '@babel/proposal-class-properties' ], [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ] ]
  }

  const config = {
    mode: MODE,
    output: { path: fromOutput('library'), filename: '[name].js', library: 'Dr', libraryTarget: 'umd' },
    entry: { 'Dr.browser': 'source/Dr.browser' },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: BABEL_OPTIONS } } ] },
    plugins: [ new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(MODE), __DEV__: MODE !== 'production' }) ]
  }

  logger.padLog(`compile with webpack mode: ${MODE}, isWatch: ${isWatch}`)
  await compileWithWebpack({ config, isWatch, logger })
}, getLogger(`webpack`))
