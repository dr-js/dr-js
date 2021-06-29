import { FILTER_TEST_JS_FILE } from '@dr-js/dev/module/node/preset.js'
import { getFileListFromPathList } from '@dr-js/dev/module/node/file.js'
import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack.js'
import { testWithPuppeteer, wrapTestScriptStringToHTML } from '@dr-js/dev/module/puppeteer.js'
import { fromPathCombo } from '@dr-js/dev/module/output.js'
import { runMain, resolve } from '@dr-js/dev/module/main.js'

import { readText } from 'source/node/fs/File.js'
import { withTestServer } from 'source/node/testServer.test.js'

const NAME_TEST_BROWSER = 'test-browser'
runMain(async (logger) => {
  const { fromRoot, fromTemp } = fromPathCombo({ PATH_TEMP: resolve(__dirname, '../.temp-gitignore') })

  const PATH_TEST_BROWSER_JS = fromTemp(`${NAME_TEST_BROWSER}.js`)

  const mode = 'production'
  const isWatch = false
  const { getCommonWebpackConfig } = await commonFlag({ mode, isWatch, fromRoot, logger })

  const config = getCommonWebpackConfig({
    output: { path: fromTemp(), filename: '[name].js', library: 'TEST_BROWSER', libraryTarget: 'window' },
    entry: {
      [ NAME_TEST_BROWSER ]: await getFileListFromPathList([
        'source/env',
        'source/common',
        'source/browser'
      ], fromRoot, FILTER_TEST_JS_FILE)
    }
  })

  logger.padLog(`compile with webpack mode: ${mode}, PATH_TEMP: ${fromTemp()}`)
  await compileWithWebpack({ config, isWatch, logger })

  const testTag = `DR_BROWSER_TEST[${new Date().toISOString()}]`
  const testAsync = withTestServer(
    async ({ testUrl }) => testWithPuppeteer({ testUrl, testTag, logger }),
    async () => wrapTestScriptStringToHTML({
      testScriptString: await readText(PATH_TEST_BROWSER_JS),
      testTag
    })
  )

  await testAsync()
}, NAME_TEST_BROWSER)
