import { resolve } from 'path'
import { DefinePlugin } from 'webpack'

import { argvFlag, runMain } from 'dev-dep-tool/module/main'
import { getLogger } from 'dev-dep-tool/module/logger'
import { getScriptFileListFromPathList } from 'dev-dep-tool/module/fileList'
import { compileWithWebpack, commonFlag } from 'dev-dep-tool/module/webpack'

import { readFileAsync } from 'source/node/file/function'
import { createDirectory } from 'source/node/file/File'
import { modify } from 'source/node/file/Modify'

import { testWithPuppeteer } from './puppeteer'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_TEMP = resolve(__dirname, '../.temp-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromTemp = (...args) => resolve(PATH_TEMP, ...args)

const NAME_BROWSER_TEST = 'browser-test'
const PATH_BROWSER_TEST_JS = fromTemp(`${NAME_BROWSER_TEST}.js`)

runMain(async (logger) => {
  const { mode, isWatch, isProduction, profileOutput, assetMapOutput } = await commonFlag({ argvFlag, fromRoot, logger })

  await createDirectory(PATH_TEMP)

  const babelOption = {
    configFile: false,
    babelrc: false,
    cacheDirectory: isProduction,
    presets: [ [ '@babel/env', { targets: { node: '8.8' }, modules: false } ] ],
    plugins: [
      isProduction && [ '@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true } ] // NOTE: for Edge(17.17134) support check: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#Spread_in_object_literals
    ].filter(Boolean)
  }

  const entryList = await getScriptFileListFromPathList([ 'source/env', 'source/common', 'source/browser' ], fromRoot, (path) => path.endsWith('.test.js'))

  const config = {
    mode,
    bail: isProduction,
    output: { path: PATH_TEMP, filename: '[name].js', library: 'DrTest', libraryTarget: 'umd' },
    entry: { [ NAME_BROWSER_TEST ]: entryList },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, use: { loader: 'babel-loader', options: babelOption } } ] },
    plugins: [ new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode), __DEV__: !isProduction }) ],
    optimization: { minimize: false },
    performance: { hints: false } // mute: `The following asset(s) exceed the recommended size limit (250 kB).`
  }

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, assetMapOutput, logger })

  const testScriptString = await readFileAsync(PATH_BROWSER_TEST_JS)
  await modify.delete(PATH_BROWSER_TEST_JS)

  await testWithPuppeteer({ testScriptString, logger })
}, getLogger(`webpack`, argvFlag('quiet')))
