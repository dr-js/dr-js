import { FILTER_TEST_JS_FILE } from '@dr-js/dev/module/node/preset'
import { getFileListFromPathList } from '@dr-js/dev/module/node/file'
import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack'
import { testWithPuppeteer, wrapTestScriptStringToHTML } from '@dr-js/dev/module/puppeteer'
import { fromPathCombo } from '@dr-js/dev/module/output.js'
import { runMain, resolve, readFileSync } from '@dr-js/dev/module/main'

import { withTestServer } from 'source/node/testServer.test'

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
      testScriptString: String(readFileSync(PATH_TEST_BROWSER_JS)),
      testTag
    })
  )

  await testAsync()
}, NAME_TEST_BROWSER)
