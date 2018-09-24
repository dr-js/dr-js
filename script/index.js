import { resolve } from 'path'
import { execSync } from 'child_process'

import { argvFlag, runMain } from 'dev-dep-tool/library/main'
import { getLogger } from 'dev-dep-tool/library/logger'
import { getScriptFileListFromPathList } from 'dev-dep-tool/library/fileList'
import { initOutput, packOutput, verifyOutputBinVersion, verifyNoGitignore, publishOutput } from 'dev-dep-tool/library/commonOutput'
import { wrapFileProcessor, fileProcessorBabel, fileProcessorWebpack } from 'dev-dep-tool/library/fileProcessor'
import { getTerserOption, minifyFileListWithTerser } from 'dev-dep-tool/library/minify'

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
  const { padLog, log } = logger
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })
  const processWebpack = wrapFileProcessor({ processor: fileProcessorWebpack, logger })

  const fileListBin = await getScriptFileListFromPathList([ 'bin' ], fromOutput)
  const fileListModule = await getScriptFileListFromPathList([ 'module' ], fromOutput)
  const fileListLibrary = await getScriptFileListFromPathList([ 'library' ], fromOutput)
  const fileListLibraryNoBrowser = fileListLibrary.filter((path) => !path.endsWith('Dr.browser.js'))

  padLog(`minify module`)
  await minifyFileListWithTerser({
    fileList: fileListModule,
    option: getTerserOption({ isModule: true }),
    rootPath: PATH_OUTPUT,
    logger
  })

  padLog(`minify library & bin`)
  await minifyFileListWithTerser({
    fileList: [ ...fileListBin, ...fileListLibrary ],
    option: getTerserOption(),
    rootPath: PATH_OUTPUT,
    logger
  })

  padLog(`process code`)
  let sizeCodeReduce = 0
  for (const filePath of [ ...fileListBin, ...fileListModule, ...fileListLibraryNoBrowser ]) sizeCodeReduce += await processBabel(filePath)
  sizeCodeReduce += await processWebpack(fromOutput('library/Dr.browser.js'))
  log(`total size reduce: ${binary(sizeCodeReduce)}B`)
}

const clearOutput = async ({ packageJSON, logger: { padLog, log } }) => {
  padLog(`clear output`)

  log(`clear test`)
  const fileList = await getScriptFileListFromPathList([ '.' ], fromOutput, (path) => path.endsWith('.test.js'))
  for (const filePath of fileList) await modify.delete(filePath)
}

runMain(async (logger) => {
  await verifyNoGitignore({ path: fromRoot('source'), logger })
  await verifyNoGitignore({ path: fromRoot('source-bin'), logger })
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!argvFlag('pack')) return

  await buildOutput({ logger })
  await processOutput({ packageJSON, logger })

  if (argvFlag('test', 'publish', 'publish-dev')) {
    logger.padLog(`test output`)
    execSync(`npm run test-mocha-output-library`, execOptionRoot)
    execSync(`npm run test-mocha-output-module`, execOptionRoot)
  }

  await clearOutput({ packageJSON, logger })
  await verifyOutputBinVersion({ matchStringList: [ packageJSON.name, packageJSON.version, process.version, process.platform, process.arch ], fromOutput, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
}, getLogger(process.argv.slice(2).join('+'), argvFlag('quiet')))
