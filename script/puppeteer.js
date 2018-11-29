import Puppeteer from 'puppeteer'
import { catchAsync } from 'source/common/error'
import { createInsideOutPromise } from 'source/common/function'
import { readFileAsync } from 'source/node/file/function'

const PATH_MOCHA_BROWSER_JS = require.resolve('mocha/mocha.js')

const puppeteerBrowserDisconnectListener = () => {
  __DEV__ && console.warn('[Puppeteer] unexpected browser disconnect, exiting')
  process.exit(-2)
}

const clearPuppeteerBrowser = ({ puppeteerBrowser }) => {
  puppeteerBrowser.removeListener('disconnected', puppeteerBrowserDisconnectListener)
  return puppeteerBrowser.close().catch((error) => {
    __DEV__ && console.warn('[Puppeteer] puppeteerBrowser clear error:', error.toString())
    process.exit(-1)
  })
}

const initPuppeteerBrowser = async ({ logger }) => {
  logger.log('[Puppeteer|Browser] init')
  const puppeteerBrowser = await Puppeteer.launch({
    args: [ '--no-sandbox' ],
    headless: true,
    // NOTE: already handled, or process exit function may get called in puppeteer
    handleSIGHUP: false,
    handleSIGINT: false,
    handleSIGTERM: false
  })
  puppeteerBrowser.addListener('disconnected', puppeteerBrowserDisconnectListener)
  logger.log('[Puppeteer|Browser] init complete')
  return puppeteerBrowser
}

const clearPuppeteerPage = ({ puppeteerPage }) => puppeteerPage.close()
  .catch((error) => { __DEV__ && console.warn('[Puppeteer] puppeteerPage clear error:', error.toString()) })

const initPuppeteerPage = async ({ puppeteerBrowser, logger }) => {
  logger.log('[Puppeteer|Page] init start')
  const puppeteerPage = await puppeteerBrowser.newPage()
  __DEV__ && puppeteerPage.on('error', (error) => logger.log('[Puppeteer|Page] error:', error)) // Emitted when the puppeteerPage crashes.
  __DEV__ && puppeteerPage.on('pageerror', (exceptionMessage) => logger.log('[Puppeteer|Page] pageerror:', exceptionMessage)) // Emitted when an uncaught exception happens within the puppeteerPage.
  __DEV__ && puppeteerPage.on('requestfailed', (request) => logger.log('[Puppeteer|Page] requestfailed:', { url: request.url(), method: request.method() }))
  // __DEV__ && puppeteerPage.on('console', (consoleMessage) => logger.log('[Puppeteer|Page] console:', consoleMessage.type(), consoleMessage.text()))
  // __DEV__ && puppeteerPage.on('request', (request) => logger.log('[Puppeteer|Page] request', { url: request.url(), method: request.method() }))
  // __DEV__ && puppeteerPage.on('response', (response) => logger.log('[Puppeteer|Page] response', { url: response.url(), ok: response.ok() }))
  logger.log('[Puppeteer|Page] init complete')
  return puppeteerPage
}

const runWithPuppeteer = async ({ taskFunc, logger }) => {
  const puppeteerBrowser = await initPuppeteerBrowser({ logger })
  const puppeteerPage = await initPuppeteerPage({ puppeteerBrowser, logger })
  logger.log('[Puppeteer|Page] test start')
  const { result, error } = await catchAsync(taskFunc, { puppeteerPage, logger })
  logger.log('[Puppeteer|Page] test done')
  await clearPuppeteerPage({ puppeteerPage })
  await clearPuppeteerBrowser({ puppeteerBrowser })
  if (error) throw error
  return result
}

const testWithPuppeteer = async ({ testScriptString, logger }) => runWithPuppeteer({
  taskFunc: async ({ puppeteerPage }) => {
    const { promise, resolve, reject } = createInsideOutPromise()
    logger.log('[test] init')

    const testTag = `BROWSER_TEST[${new Date().toISOString()}]`
    const testHTML = [
      `<!DOCTYPE html>`,
      `<meta charset="utf-8">`,
      `<link rel="icon" href="data:,">`, // stop fetch favicon
      `<title>${testTag}</title>`,
      `<script>${await readFileAsync(PATH_MOCHA_BROWSER_JS)}</script>`,
      `<script>window.mocha.setup({ ui: 'bdd', reporter: 'spec' })</script>`, // reporter: use console.log instead of render HTML
      `<script>${testScriptString}</script>`,
      `<script>window.mocha.run((failCount) => { console.log(JSON.stringify({ "${testTag}": { failCount } })) })</script>`
    ].join('\n')
    // await writeFileAsync(PATH_BROWSER_TEST_HTML, testHTML) // extra output

    puppeteerPage.on('console', (consoleMessage) => {
      const logType = consoleMessage.type()
      const logText = consoleMessage.text()
      logger.log(`[test|${logType}] ${logText}`)
      if (!logText.includes(testTag)) return
      const { [ testTag ]: { failCount } } = JSON.parse(logText)
      failCount
        ? reject(new Error(`${failCount} test failed`))
        : resolve()
    })
    await puppeteerPage.setContent(testHTML, { waitUntil: 'load', timeout: 10000 })
    await puppeteerPage.setViewport({ width: 0, height: 0 }) // TODO: CHECK: if this will save render time
    logger.log('[test] start')

    const timeoutToken = setTimeout(() => reject(new Error(`test timeout`)), 60 * 1000) // should done test in 1min
    await promise
    clearTimeout(timeoutToken)
    logger.log('[test] done')
  },
  logger
})

export {
  clearPuppeteerBrowser,
  initPuppeteerBrowser,
  clearPuppeteerPage,
  initPuppeteerPage,
  runWithPuppeteer,
  testWithPuppeteer
}
