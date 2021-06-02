import { getSourceJsFileListFromPathList } from '@dr-js/dev/module/node/filePreset'
import { initOutput, packOutput, clearOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, publishOutput } from '@dr-js/dev/module/output'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify'
import { processFileList, fileProcessorBabel } from '@dr-js/dev/module/fileProcessor'
import { runMain, argvFlag, commonCombo } from '@dr-js/dev/module/main'

const retrySync = process.platform === 'linux'
  ? (func, ...args) => func(...args) // one chance should be enough for linux
  : (func, ...args) => { // +3 more chance, since some net/fs test is still flaky
    try { return func(...args) } catch (error) {
      console.error('[retrySync|0]', error)
      try { return func(...args) } catch (error) {
        console.error('[retrySync|1]', error)
        try { return func(...args) } catch (error) {
          console.error('[retrySync|2]', error)
          return func(...args)
        }
      }
    }
  }

runMain(async (logger) => {
  const { fromRoot, fromOutput, RUN } = commonCombo(logger)

  const processOutput = async ({ logger }) => {
    const fileListBin = await getSourceJsFileListFromPathList([ 'bin' ], fromOutput)
    const fileListModule = await getSourceJsFileListFromPathList([ 'module' ], fromOutput)
    const fileListLibrary = await getSourceJsFileListFromPathList([ 'library' ], fromOutput)
    const fileListLibraryNoBrowser = fileListLibrary.filter((path) => !path.endsWith('Dr.browser.js'))
    const fileListLibraryOnlyBrowser = fileListLibrary.filter((path) => path.endsWith('Dr.browser.js'))

    let sizeReduce = 0
    sizeReduce += await minifyFileListWithTerser({ fileList: [ ...fileListModule, ...fileListLibraryNoBrowser ], option: getTerserOption({ isReadable: true }), rootPath: fromOutput(), logger })
    sizeReduce += await minifyFileListWithTerser({ fileList: [ ...fileListBin, ...fileListLibraryOnlyBrowser ], option: getTerserOption(), rootPath: fromOutput(), logger })
    sizeReduce += await processFileList({ fileList: [ ...fileListBin, ...fileListModule, ...fileListLibraryNoBrowser ], processor: fileProcessorBabel, rootPath: fromOutput(), logger })
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
  logger.padLog('delete temp build file')
  RUN('npm run script-delete-temp-build-file')
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
  isTest && retrySync(RUN, 'npm run test-output-library')
  isTest && retrySync(RUN, 'npm run test-output-module')
  isTest && retrySync(RUN, 'npm run test-output-bin')
  isTest && logger.padLog('test browser')
  isTest && retrySync(RUN, 'npm run test-browser')
  isTest && logger.padLog('test bin')
  isTest && RUN('npm run test-bin')
  await clearOutput({ fromOutput, logger })
  await verifyOutputBin({ fromOutput, packageJSON, logger })
  isTest && await verifyGitStatusClean({ fromRoot, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ packageJSON, pathPackagePack, logger })
})
