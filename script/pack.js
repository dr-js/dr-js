import { getSourceJsFileListFromPathList } from '@dr-js/dev/module/node/filePreset.js'
import { initOutput, packOutput, clearOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, verifyPackageVersionStrict, publishPackage } from '@dr-js/dev/module/output.js'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify.js'
import { processFileList, fileProcessorBabel } from '@dr-js/dev/module/fileProcessor.js'

import { withRetry } from 'source/common/function.js'
import { runKit, argvFlag } from 'source/node/kit.js'

const retryCount = process.platform === 'linux'
  ? 1 // one chance should be enough for linux
  : 6 // 6 more chance for win32/darwin, since some net/fs test is still flaky
const retryNpmRunTest = (kit, name) => withRetry((failed, maxRetry) => {
  try { return kit.RUN(`npm run ${name}`) } catch (error) {
    console.error(`##[warning] [retry|${name}|${failed}/${maxRetry}]`, error) // https://github.com/actions/runner/blob/v2.278.0/src/Runner.Worker/ExecutionContext.cs#L1021-L1028
  }
}, retryCount)

runKit(async (kit) => {
  const processOutput = async ({ kit }) => {
    const fileListFull = await getSourceJsFileListFromPathList([ 'module', 'library', 'bin' ], kit.fromOutput)
    const fileListNoBrowser = fileListFull.filter((path) => !path.endsWith('Dr.browser.js'))

    let sizeReduce = 0
    sizeReduce += await minifyFileListWithTerser({ fileList: fileListFull, option: getTerserOption({ isReadable: true }), kit })
    sizeReduce += await processFileList({ fileList: fileListNoBrowser, processor: fileProcessorBabel, kit })
    kit.padLog(`size reduce: ${sizeReduce}B`)
  }

  await verifyNoGitignore({ path: kit.fromRoot('source'), kit })
  await verifyNoGitignore({ path: kit.fromRoot('source-bin'), kit })
  const packageJSON = await initOutput({ kit })
  if (!argvFlag('pack')) return

  const isPublish = argvFlag('publish')
  isPublish && verifyPackageVersionStrict(packageJSON.version)
  kit.padLog('generate spec & index.js')
  kit.RUN('npm run script-generate-spec')
  kit.padLog('build library-webpack')
  kit.RUN('npm run build-library-webpack')
  kit.padLog('build library-babel')
  kit.RUN('npm run build-library-babel')
  kit.padLog('build module')
  kit.RUN('npm run build-module')
  kit.padLog('build bin')
  kit.RUN('npm run build-bin')

  await processOutput({ kit })
  const isTest = argvFlag('test', 'publish')
  isTest && kit.padLog('lint source')
  isTest && kit.RUN('npm run lint')
  isTest && kit.RUN('npm run type-check')
  isTest && await processOutput({ kit }) // once more
  isTest && kit.padLog('test output')
  isTest && await retryNpmRunTest(kit, 'test-output-library')
  isTest && await retryNpmRunTest(kit, 'test-output-module')
  isTest && await retryNpmRunTest(kit, 'test-output-bin')
  isTest && kit.padLog('test browser')
  isTest && await retryNpmRunTest(kit, 'test-browser')
  isTest && kit.padLog('test bin')
  isTest && kit.RUN('npm run test-bin')
  await clearOutput({ kit })
  await verifyOutputBin({ packageJSON, kit })
  isTest && await verifyGitStatusClean({ kit })
  const pathPackagePack = await packOutput({ kit })
  isPublish && await publishPackage({ packageJSON, pathPackagePack, kit })
})
