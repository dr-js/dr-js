import { resolve } from 'path'
import { execSync } from 'child_process'

import { getScriptFileListFromPathList } from '@dr-js/dev/module/node/file'
import { runMain, argvFlag } from '@dr-js/dev/module/main'
import { initOutput, packOutput, verifyOutputBinVersion, verifyNoGitignore, publishOutput } from '@dr-js/dev/module/output'
import { processFileList, fileProcessorBabel, fileProcessorWebpack } from '@dr-js/dev/module/fileProcessor'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify'

import { binary } from 'source/common/format'
import { modifyDelete } from 'source/node/file/Modify'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execShell = (command) => execSync(command, { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', shell: true })

const buildOutput = async ({ logger: { padLog } }) => {
  padLog('generate index.js & spec doc')
  execShell('npm run script-generate-spec')

  padLog('build library-webpack')
  execShell('npm run build-library-webpack')

  padLog('delete temp build file')
  execShell('npm run script-delete-temp-build-file')

  padLog('build library-babel')
  execShell('npm run build-library-babel')

  padLog('build module')
  execShell('npm run build-module')

  padLog('build bin')
  execShell('npm run build-bin')
}

const processOutput = async ({ logger }) => {
  const fileListBin = await getScriptFileListFromPathList([ 'bin' ], fromOutput)
  const fileListModule = await getScriptFileListFromPathList([ 'module' ], fromOutput)
  const fileListLibrary = await getScriptFileListFromPathList([ 'library' ], fromOutput)
  const fileListLibraryNoBrowser = fileListLibrary.filter((path) => !path.endsWith('Dr.browser.js'))

  let sizeReduce = 0

  sizeReduce += await minifyFileListWithTerser({ fileList: fileListModule, option: getTerserOption({ isReadable: true }), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await minifyFileListWithTerser({ fileList: [ ...fileListBin, ...fileListLibrary ], option: getTerserOption(), rootPath: PATH_OUTPUT, logger })

  sizeReduce += await processFileList({ fileList: [ ...fileListBin, ...fileListModule, ...fileListLibraryNoBrowser ], processor: fileProcessorBabel, rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList: [ fromOutput('library/Dr.browser.js') ], processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })

  logger.padLog(`total size reduce: ${binary(sizeReduce)}B`)
}

const clearOutput = async ({ logger }) => {
  logger.padLog('clear output')

  logger.log('clear test')
  const fileList = await getScriptFileListFromPathList([ '.' ], fromOutput, (path) => path.endsWith('.test.js'))
  for (const filePath of fileList) await modifyDelete(filePath)
}

runMain(async (logger) => {
  await verifyNoGitignore({ path: fromRoot('source'), logger })
  await verifyNoGitignore({ path: fromRoot('source-bin'), logger })

  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!argvFlag('pack')) return

  if (argvFlag('test', 'publish', 'publish-dev')) {
    logger.padLog('lint source')
    execShell('npm run lint')
  }

  await buildOutput({ logger })
  await processOutput({ logger })

  if (argvFlag('test', 'publish', 'publish-dev')) {
    await processOutput({ logger }) // once more

    logger.padLog('test output')
    execShell('npm run test-output-library')
    execShell('npm run test-output-module')

    logger.padLog('test browser')
    execShell('npm run test-browser')
  }

  await clearOutput({ logger })
  await verifyOutputBinVersion({ matchStringList: [ packageJSON.name, packageJSON.version, process.version, process.platform, process.arch ], fromOutput, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, isPublicScoped: true, packageJSON, pathPackagePack, logger })
})
