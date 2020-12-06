import { resolve } from 'path'
import { execSync } from 'child_process'

import { getSourceJsFileListFromPathList } from '@dr-js/dev/module/node/filePreset'
import { initOutput, packOutput, clearOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, publishOutput } from '@dr-js/dev/module/output'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify'
import { processFileList, fileProcessorBabel, fileProcessorWebpack } from '@dr-js/dev/module/fileProcessor'
import { runMain, argvFlag } from '@dr-js/dev/module/main'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execShell = (command) => execSync(command, { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit' })

const buildOutput = async ({ logger }) => {
  logger.padLog('generate spec & index.js')
  execShell('npm run script-generate-spec')
  logger.padLog('build library-webpack')
  execShell('npm run build-library-webpack')
  logger.padLog('delete temp build file')
  execShell('npm run script-delete-temp-build-file')
  logger.padLog('build library-babel')
  execShell('npm run build-library-babel')
  logger.padLog('build module')
  execShell('npm run build-module')
  logger.padLog('build bin')
  execShell('npm run build-bin')
}

const processOutput = async ({ logger }) => {
  const fileListBin = await getSourceJsFileListFromPathList([ 'bin' ], fromOutput)
  const fileListModule = await getSourceJsFileListFromPathList([ 'module' ], fromOutput)
  const fileListLibrary = await getSourceJsFileListFromPathList([ 'library' ], fromOutput)
  const fileListLibraryNoBrowser = fileListLibrary.filter((path) => !path.endsWith('Dr.browser.js'))
  let sizeReduce = 0
  sizeReduce += await minifyFileListWithTerser({ fileList: fileListModule, option: getTerserOption({ isReadable: true }), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await minifyFileListWithTerser({ fileList: [ ...fileListBin, ...fileListLibrary ], option: getTerserOption(), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList: [ ...fileListBin, ...fileListModule, ...fileListLibraryNoBrowser ], processor: fileProcessorBabel, rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList: [ fromOutput('library/Dr.browser.js') ], processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })
  logger.padLog(`size reduce: ${sizeReduce}B`)
}

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
  await verifyNoGitignore({ path: fromRoot('source'), logger })
  await verifyNoGitignore({ path: fromRoot('source-bin'), logger })
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })
  if (!argvFlag('pack')) return
  await buildOutput({ logger })
  await processOutput({ logger })
  const isTest = argvFlag('test', 'publish', 'publish-dev')
  isTest && logger.padLog('lint source')
  isTest && execShell('npm run lint')
  isTest && await processOutput({ logger }) // once more
  isTest && logger.padLog('test output')
  isTest && retrySync(execShell, 'npm run test-output-library')
  isTest && retrySync(execShell, 'npm run test-output-module')
  isTest && retrySync(execShell, 'npm run test-output-bin')
  isTest && logger.padLog('test browser')
  isTest && retrySync(execShell, 'npm run test-browser')
  isTest && logger.padLog('test bin')
  isTest && execShell('npm run test-bin')
  await clearOutput({ fromOutput, logger })
  await verifyOutputBin({ fromOutput, packageJSON, logger })
  isTest && await verifyGitStatusClean({ fromRoot, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ packageJSON, pathPackagePack, logger })
})
