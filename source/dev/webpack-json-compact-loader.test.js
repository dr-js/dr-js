import { deepStrictEqual } from 'node:assert'
import { resolve } from 'node:path'
import { resetDirectory } from 'source/node/fs/Directory.js'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { runStdout } from 'source/node/run.js'
import { getKit } from 'source/node/kit.js'
import { compileWithWebpack, commonFlag } from './webpack.js'
import { getWebpackBabelConfig } from './babel.js'

const { describe, it, before, after, info = console.log } = globalThis

const PATH_TEST_ROOT = resolve(__dirname, 'test-webpack-json-compact-loader-gitignore/')
before(() => resetDirectory(PATH_TEST_ROOT))
after(() => modifyDelete(PATH_TEST_ROOT))

describe('webpack-json-compact-loader', () => {
  it('test webpack build', async () => {
    const kit = getKit({ PATH_TEMP: PATH_TEST_ROOT, logFunc: info })
    const { mode, isWatch, isProduction, profileOutput, getCommonWebpackConfig } = await commonFlag({ kit })
    const config = getCommonWebpackConfig({
      babelOption: null, // do not use default
      output: { path: kit.fromTemp(), filename: 'index.js', libraryTarget: 'commonjs2' },
      entry: { 'index': kit.fromRoot('script/webpack-json-compact-loader.test/index.js') },
      extraModuleRuleList: [
        { test: /\.js$/, exclude: /\.@json\.js$/, use: { loader: 'babel-loader', options: getWebpackBabelConfig({ isProduction }) } },
        { test: /\.@json\.js$/, use: { loader: resolve(__dirname, './webpack-json-compact-loader.js'), options: { useConst: true } } }
      ]
    })
    kit.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
    await compileWithWebpack({ config, isWatch, profileOutput, kit })

    const runNodeForStdout = async (...argList) => {
      const stdoutString = String(await runStdout([ ...argList ], { cwd: kit.fromRoot() }))
      kit.log(stdoutString)
      return stdoutString
    }

    kit.padLog('run test output')
    const testOutputString = await runNodeForStdout(process.execPath, '-p', 'JSON.stringify(require(process.argv[1]))', kit.fromTemp('index.js'))
    kit.padLog('run test source')
    const testSourceString = await runNodeForStdout(process.execPath, '-r', '@babel/register', '-p', 'JSON.stringify(require(process.argv[1]))', kit.fromRoot('script/webpack-json-compact-loader.test/index.js'))
    deepStrictEqual(JSON.parse(testOutputString), JSON.parse(testSourceString), 'the data should be the same through webpack')
  })
})
