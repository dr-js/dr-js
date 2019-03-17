import { resolve } from 'path'
import { execSync } from 'child_process'

import { getScriptFileListFromPathList } from 'dr-dev/module/node/fileList'
import { runMain, argvFlag } from 'dr-dev/module/main'
import { initOutput, packOutput, verifyOutputBinVersion, verifyNoGitignore, publishOutput } from 'dr-dev/module/output'
import { processFileList, fileProcessorBabel, fileProcessorWebpack } from 'dr-dev/module/fileProcessor'
import { getTerserOption, minifyFileListWithTerser } from 'dr-dev/module/minify'
import { writeLicenseFile } from 'dr-dev/module/license'

import { binary } from 'source/common/format'
import { modify } from 'source/node/file/Modify'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', shell: true }

const buildOutput = async ({ logger: { padLog } }) => {
  padLog(`generate index.js & spec doc`)
  execSync('npm run script-generate-spec', execOptionRoot)

  padLog(`build library-webpack`)
  execSync('npm run build-library-webpack', execOptionRoot)

  padLog(`delete temp build file`)
  execSync('npm run script-delete-temp-build-file', execOptionRoot)

  padLog(`build library-babel`)
  execSync('npm run build-library-babel', execOptionRoot)

  padLog(`build module`)
  execSync('npm run build-module', execOptionRoot)

  padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)
}

const processOutput = async ({ packageJSON, logger }) => {
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
  logger.padLog(`clear output`)

  logger.log(`clear test`)
  const fileList = await getScriptFileListFromPathList([ '.' ], fromOutput, (path) => path.endsWith('.test.js'))
  for (const filePath of fileList) await modify.delete(filePath)
}

runMain(async (logger) => {
  await verifyNoGitignore({ path: fromRoot('source'), logger })
  await verifyNoGitignore({ path: fromRoot('source-bin'), logger })

  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })
  writeLicenseFile(fromRoot('LICENSE'), packageJSON.license, packageJSON.author)

  if (!argvFlag('pack')) return

  await buildOutput({ logger })
  await processOutput({ packageJSON, logger })

  if (argvFlag('test', 'publish', 'publish-dev')) {
    await processOutput({ packageJSON, logger }) // once more

    logger.padLog(`test browser`)
    execSync(`npm run test-browser`, execOptionRoot)

    logger.padLog(`test output`)
    execSync(`npm run test-output-library`, execOptionRoot)
    execSync(`npm run test-output-module`, execOptionRoot)
  }

  await clearOutput({ logger })
  await verifyOutputBinVersion({ matchStringList: [ packageJSON.name, packageJSON.version, process.version, process.platform, process.arch ], fromOutput, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
})
