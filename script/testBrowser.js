import { resolve } from 'path'
import { DefinePlugin } from 'webpack'

import { argvFlag, runMain } from 'dr-dev/module/main'
import { getLogger } from 'dr-dev/module/logger'
import { getScriptFileListFromPathList } from 'dr-dev/module/fileList'
import { compileWithWebpack, commonFlag } from 'dr-dev/module/webpack'
import { testWithPuppeteer } from 'dr-dev/module/puppeteer'

import { readFileAsync } from 'source/node/file/function'
import { createDirectory } from 'source/node/file/File'
import { modify } from 'source/node/file/Modify'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_TEMP = resolve(__dirname, '../.temp-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromTemp = (...args) => resolve(PATH_TEMP, ...args)

const NAME_TEST_BROWSER = 'test-browser'
const PATH_TEST_BROWSER_JS = fromTemp(`${NAME_TEST_BROWSER}.js`)

runMain(async (logger) => {
  const { mode, isWatch, isProduction, profileOutput, assetMapOutput } = await commonFlag({ argvFlag, fromRoot, logger })

  await createDirectory(PATH_TEMP)

  const babelOption = {
    configFile: false,
    babelrc: false,
    presets: [ [ '@babel/env', { targets: { node: '8.8' }, modules: false } ] ]
  }

  const entryList = await getScriptFileListFromPathList(
    [ 'source/env', 'source/common', 'source/browser' ],
    fromRoot,
    (path) => path.endsWith('.test.js')
  )

  const config = {
    mode,
    bail: true,
    output: { path: PATH_TEMP, filename: '[name].js', library: 'DrTest', libraryTarget: 'umd' },
    entry: { [ NAME_TEST_BROWSER ]: entryList },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, use: { loader: 'babel-loader', options: babelOption } } ] },
    plugins: [ new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode), __DEV__: !isProduction }) ],
    optimization: { minimize: false },
    performance: { hints: false } // mute: `The following asset(s) exceed the recommended size limit (250 kB).`
  }

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, assetMapOutput, logger })

  const testScriptString = await readFileAsync(PATH_TEST_BROWSER_JS)
  await modify.delete(PATH_TEST_BROWSER_JS)

  await testWithPuppeteer({ testScriptString, logger })
}, getLogger(NAME_TEST_BROWSER, argvFlag('quiet')))
