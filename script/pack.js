import { getSourceJsFileListFromPathList } from '@dr-js/dev/module/node/filePreset.js'
import { initOutput, packOutput, clearOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, publishOutput } from '@dr-js/dev/module/output.js'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify.js'
import { processFileList, fileProcessorBabel } from '@dr-js/dev/module/fileProcessor.js'
import { runMain, argvFlag, commonCombo } from '@dr-js/dev/module/main.js'

import { withRetry } from 'source/common/function.js'

const retryCount = process.platform === 'linux'
  ? 1 // one chance should be enough for linux
  : 6 // 6 more chance for win32/darwin, since some net/fs test is still flaky
const retryTest = (func, ...args) => withRetry((failed, maxRetry) => {
  try { return func(...args) } catch (error) {
    console.error(`##[warning] [retry|${failed}/${maxRetry}]`, error) // https://github.com/actions/runner/blob/v2.278.0/src/Runner.Worker/ExecutionContext.cs#L1021-L1028
  }
}, retryCount, 1000)

runMain(async (logger) => {
  const { fromRoot, fromOutput, RUN } = commonCombo(logger)

  const processOutput = async ({ logger }) => {
    const fileListFull = await getSourceJsFileListFromPathList([ 'module', 'library', 'bin' ], fromOutput)
    const fileListNoBrowser = fileListFull.filter((path) => !path.endsWith('Dr.browser.js'))

    let sizeReduce = 0
    sizeReduce += await minifyFileListWithTerser({ fileList: fileListFull, option: getTerserOption({ isReadable: true }), rootPath: fromOutput(), logger })
    sizeReduce += await processFileList({ fileList: fileListNoBrowser, processor: fileProcessorBabel, rootPath: fromOutput(), logger })
    logger.padLog(`size reduce: ${sizeReduce}B`)
  }

  await verifyNoGitignore({ path: fromRoot('source'), logger })
  await verifyNoGitignore({ path: fromRoot('source-bin'), logger })
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })
  if (!argvFlag('pack')) return

  logger.padLog('generate spec & index.js')
  RUN('npm run script-generate-spec')
  logger.padLog('build library-webpack')
  RUN('npm run build-library-webpack')
  logger.padLog('build library-babel')
  RUN('npm run build-library-babel')
  logger.padLog('build module')
  RUN('npm run build-module')
  logger.padLog('build bin')
  RUN('npm run build-bin')

  await processOutput({ logger })
  const isTest = argvFlag('test', 'publish', 'publish-dev')
  isTest && logger.padLog('lint source')
  isTest && RUN('npm run lint')
  isTest && await processOutput({ logger }) // once more
  isTest && logger.padLog('test output')
  isTest && await retryTest(RUN, 'npm run test-output-library')
  isTest && await retryTest(RUN, 'npm run test-output-module')
  isTest && await retryTest(RUN, 'npm run test-output-bin')
  isTest && logger.padLog('test browser')
  isTest && await retryTest(RUN, 'npm run test-browser')
  isTest && logger.padLog('test bin')
  isTest && RUN('npm run test-bin')
  await clearOutput({ fromOutput, logger })
  await verifyOutputBin({ fromOutput, packageJSON, logger })
  isTest && await verifyGitStatusClean({ fromRoot, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ packageJSON, pathPackagePack, logger })
})
