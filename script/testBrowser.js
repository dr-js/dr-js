import { FILTER_TEST_JS_FILE } from '@dr-js/dev/module/node/preset.js'
import { getFileListFromPathList } from '@dr-js/dev/module/node/file.js'
import { compileWithWebpack, commonFlag } from '@dr-js/dev/module/webpack.js'
import { testWithPuppeteer, wrapTestScriptStringToHTML } from '@dr-js/dev/module/puppeteer.js'

import { readText, writeText } from 'source/node/fs/File.js'
import { runKit } from 'source/node/kit.js'
import { withTestServer } from 'source/node/testServer.test.js'

const NAME_TEST_BROWSER = 'test-browser'

runKit(async (kit) => {
  const mode = 'production'
  const isWatch = false
  const { getCommonWebpackConfig } = await commonFlag({ mode, isWatch, kit })

  const config = getCommonWebpackConfig({
    output: { path: kit.fromTemp(), filename: '[name].js', iife: true },
    entry: {
      [ NAME_TEST_BROWSER ]: await getFileListFromPathList([
        'source/env',
        'source/common',
        'source/browser'
      ], kit.fromRoot, FILTER_TEST_JS_FILE)
    },
    extraDefine: { // remove node specific `process.*` from test
      'process.platform': JSON.stringify('browser'),
      'process.env': {}
    }
  })

  kit.padLog(`compile with webpack mode: ${mode}, PATH_TEMP: ${kit.fromTemp()}`)
  await compileWithWebpack({ config, isWatch, kit })

  const testTag = `DR_BROWSER_TEST[${new Date().toISOString()}]`
  const testHTML = await wrapTestScriptStringToHTML({
    testScriptString: await readText(kit.fromTemp(`${NAME_TEST_BROWSER}.js`)),
    testTag
  })
  await writeText(kit.fromTemp(`${NAME_TEST_BROWSER}.html`), testHTML)

  const testAsync = withTestServer( // NOTE: need a server for web fetch test
    async ({ testUrl }) => testWithPuppeteer({ testUrl, testTag, kit }),
    async (baseUrl) => testHTML
  )

  await testAsync()
}, { title: NAME_TEST_BROWSER })
