import { resolve } from 'path'
import { readFileSync } from 'fs'

import { getScriptFileListFromPathList } from '@dr-js/dev/module/node/file'
import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack'
import { testWithPuppeteer, wrapTestScriptStringToHTML } from '@dr-js/dev/module/puppeteer'
import { runMain } from '@dr-js/dev/module/main'

import { withTestServer } from 'source/node/net-test-server.test'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_TEMP = resolve(__dirname, '../.temp-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromTemp = (...args) => resolve(PATH_TEMP, ...args)

const NAME_TEST_BROWSER = 'test-browser'
const PATH_TEST_BROWSER_JS = fromTemp(`${NAME_TEST_BROWSER}.js`)

runMain(async (logger) => {
  const mode = 'production'
  const isWatch = false
  const { getCommonWebpackConfig } = await commonFlag({ mode, isWatch, fromRoot, logger })

  const config = getCommonWebpackConfig({
    output: { path: PATH_TEMP, filename: '[name].js', library: 'TEST_BROWSER', libraryTarget: 'window' },
    entry: {
      [ NAME_TEST_BROWSER ]: await getScriptFileListFromPathList([
        'source/env',
        'source/common',
        'source/browser'
      ], fromRoot, (path) => path.endsWith('.test.js'))
    }
  })

  logger.padLog(`compile with webpack mode: ${mode}, PATH_TEMP: ${PATH_TEMP}`)
  await compileWithWebpack({ config, isWatch, logger })

  const testTag = `DR_BROWSER_TEST[${new Date().toISOString()}]`
  const testAsync = withTestServer(
    async (baseUrl, testUrl) => testWithPuppeteer({
      testUrl,
      testTag,
      logger
    }),
    async () => wrapTestScriptStringToHTML({
      testScriptString: String(readFileSync(PATH_TEST_BROWSER_JS)),
      testTag
    })
  )

  await testAsync()
}, NAME_TEST_BROWSER)
