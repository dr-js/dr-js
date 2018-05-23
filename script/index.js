import { ok } from 'assert'
import { resolve } from 'path'
import { execSync } from 'child_process'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { wrapFileProcessor, fileProcessorBabel, fileProcessorWebpack } from 'dev-dep-tool/library/fileProcessor'
import { initOutput, packOutput, publishOutput } from 'dev-dep-tool/library/commonOutput'
import { getUglifyESOption, minifyFileListWithUglifyEs } from 'dev-dep-tool/library/uglify'

import { binary } from 'source/common/format'
import { modify } from 'source/node/file/Modify'
import { getFileList } from 'source/node/file/Directory'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', shell: true }

const buildOutput = async ({ logger: { padLog } }) => {
  padLog(`verify no gitignore file left`)
  const badFileList = (await getFileList(fromRoot('source'))).filter((path) => path.includes('gitignore'))
  ok(!badFileList.length, `bad file:\n - ${badFileList.join('\n - ')}`)

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

  padLog(`minify module`)
  await minifyFileListWithUglifyEs({
    fileList: (await getFileList(fromOutput('module'))).filter((path) => path.endsWith('.js') && !path.endsWith('.test.js')),
    option: getUglifyESOption({ isDevelopment: false, isModule: true }),
    rootPath: PATH_OUTPUT,
    logger
  })

  padLog(`minify library`)
  await minifyFileListWithUglifyEs({
    fileList: [
      ...await getFileList(fromOutput('bin')),
      ...await getFileList(fromOutput('library'))
    ].filter((path) => path.endsWith('.js') && !path.endsWith('.test.js') && !path.endsWith('Dr.browser.js')),
    option: getUglifyESOption({ isDevelopment: false, isModule: false }),
    rootPath: PATH_OUTPUT,
    logger
  })

  padLog(`process code`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) sizeCodeReduceBin += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`bin size reduce: ${binary(sizeCodeReduceBin)}B`)

  let sizeCodeReduceModule = 0
  for (const filePath of await getFileList(fromOutput('module'))) sizeCodeReduceModule += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`module size reduce: ${binary(sizeCodeReduceModule)}B`)

  let sizeCodeReduceLibraryBabel = 0
  for (const filePath of await getFileList(fromOutput('library'))) sizeCodeReduceLibraryBabel += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`library-babel size reduce: ${binary(sizeCodeReduceLibraryBabel)}B`)

  const sizeCodeReduceLibraryWebpack = await processWebpack(fromOutput('library/Dr.browser.js'))
  log(`library-webpack size reduce: ${binary(sizeCodeReduceLibraryWebpack)}B`)

  log(`total size reduce: ${binary(
    sizeCodeReduceBin +
    sizeCodeReduceModule +
    sizeCodeReduceLibraryBabel +
    sizeCodeReduceLibraryWebpack
  )}B`)
}

const clearOutput = async ({ packageJSON, logger: { padLog, log } }) => {
  padLog(`clear output`)

  log(`clear module test`)
  for (const filePath of await getFileList(fromOutput('module'))) filePath.endsWith('.test.js') && await modify.delete(filePath)

  log(`clear library test`)
  for (const filePath of await getFileList(fromOutput('library'))) filePath.endsWith('.test.js') && await modify.delete(filePath)
}

const verifyOutput = async ({ packageJSON, logger: { padLog, log } }) => {
  padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  log(`bin test output: ${outputBinTest}`)
  for (const testString of [
    packageJSON.name, packageJSON.version,
    process.version, process.platform, process.arch
  ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

runMain(async (logger) => {
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
  await verifyOutput({ packageJSON, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
}, getLogger(process.argv.slice(2).join('+'), argvFlag('quiet')))
