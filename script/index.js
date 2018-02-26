import { ok } from 'assert'
import { resolve } from 'path'
import { execSync } from 'child_process'

import { loadFlag, checkFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { wrapFileProcessor, fileProcessorBabel, fileProcessorWebpack } from 'dev-dep-tool/library/fileProcessor'
import { initOutput, packOutput } from 'dev-dep-tool/library/commonOutput'

import { binary as formatBinary, stringIndentLine } from 'source/common/format'
import { modify } from 'source/node/file/Modify'
import { getFileList } from 'source/node/file/Directory'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }

const buildOutput = async ({ logger: { padLog } }) => {
  padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)

  padLog(`build module`)
  execSync('npm run build-module', execOptionRoot)

  padLog(`build library-babel`)
  execSync('npm run build-library-babel', execOptionRoot)

  padLog(`generate index.js & export doc`)
  execSync('npm run script-generate-index', execOptionRoot)

  padLog(`build library-webpack`)
  execSync('npm run build-library-webpack', execOptionRoot)

  padLog(`delete temp build file`)
  execSync('npm run script-delete-temp-build-file', execOptionRoot)
}

const processOutput = async ({ packageJSON, logger }) => {
  const { padLog, log } = logger
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })
  const processWebpack = wrapFileProcessor({ processor: fileProcessorWebpack, logger })

  padLog(`process minify-module`)
  execSync('npm run minify-module', execOptionRoot)

  padLog(`process minify-library`)
  execSync('npm run minify-library', execOptionRoot)

  log(`process bin`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) sizeCodeReduceBin += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`bin size reduce: ${formatBinary(sizeCodeReduceBin)}B`)

  log(`process module`)
  let sizeCodeReduceModule = 0
  for (const filePath of await getFileList(fromOutput('module'))) sizeCodeReduceModule += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`module size reduce: ${formatBinary(sizeCodeReduceModule)}B`)

  log(`process library-babel`)
  let sizeCodeReduceLibraryBabel = 0
  for (const filePath of await getFileList(fromOutput('library'))) sizeCodeReduceLibraryBabel += filePath.endsWith('.test.js') ? 0 : await processBabel(filePath)
  log(`library-babel size reduce: ${formatBinary(sizeCodeReduceLibraryBabel)}B`)

  log(`process library-webpack`)
  const sizeCodeReduceLibraryWebpack = await processWebpack(fromOutput('library/Dr.browser.js'))
  log(`library-webpack size reduce: ${formatBinary(sizeCodeReduceLibraryWebpack)}B`)

  padLog(`total size reduce: ${formatBinary(
    sizeCodeReduceBin +
    sizeCodeReduceModule +
    sizeCodeReduceLibraryBabel +
    sizeCodeReduceLibraryWebpack
  )}B`)
}

const clearOutput = async ({ packageJSON, logger: { log } }) => {
  log(`clear module test`)
  for (const filePath of await getFileList(fromOutput('module'))) filePath.endsWith('.test.js') && await modify.delete(filePath)

  log(`clear library test`)
  for (const filePath of await getFileList(fromOutput('library'))) filePath.endsWith('.test.js') && await modify.delete(filePath)
}

const verifyOutput = async ({ packageJSON, logger: { padLog, log } }) => {
  padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  log(`bin test output: \n${stringIndentLine(outputBinTest, '  ')}`)
  for (const testString of [
    packageJSON.name, packageJSON.version,
    process.version, process.platform, process.arch
  ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

const FLAG_LIST = loadFlag([ 'pack', 'test', 'publish', 'publish-dev' ])
const hasFlag = (flag) => FLAG_LIST.includes(flag)

runMain(async (logger) => {
  const RUN_TEST = Boolean(checkFlag(FLAG_LIST, [ 'test', 'publish', 'publish-dev' ]))

  RUN_TEST && logger.padLog('test source')
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require @babel/register "source/**/*.test.js"`, execOptionRoot)

  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!hasFlag('pack')) return

  await buildOutput({ logger })
  await processOutput({ packageJSON, logger })

  RUN_TEST && logger.padLog(`test output`)
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require @babel/register "output-gitignore/**/*.test.js"`, execOptionRoot)

  await clearOutput({ packageJSON, logger })
  await verifyOutput({ packageJSON, logger })
  await packOutput({ fromRoot, fromOutput, logger })

  hasFlag('publish') && execSync('npm publish', execOptionOutput)
  hasFlag('publish-dev') && execSync('npm publish --tag dev', execOptionOutput)
}, getLogger(FLAG_LIST.join('+')))
