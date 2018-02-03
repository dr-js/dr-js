import { ok } from 'assert'
import { resolve } from 'path'
import { execSync } from 'child_process'

import { runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { wrapFileProcessor, fileProcessorBabel, fileProcessorWebpack } from 'dev-dep-tool/library/fileProcessor'
import { initOutput, packOutput } from 'dev-dep-tool/library/commonOutput'

import { binary as formatBinary, stringIndentLine } from 'source/common/format'
import { getFileList } from 'source/node/file/Directory'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }

const argvList = process.argv.slice(2)
const logger = getLogger([ 'dr-js', ...argvList ].join('|'))
const { padLog, log } = logger

const RUN_TEST = [ 'test', 'publish', 'publish-dev' ].some((v) => argvList.includes(v))

const REGEXP_DELETE_FILE_PATH = /(\.test|index|Dr|Dr\.node|Dr\.browser)\.js$/
const processSource = async ({ packageJSON }) => {
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })
  const processWebpack = wrapFileProcessor({ processor: fileProcessorWebpack, logger })
  const processDelete = wrapFileProcessor({ processor: () => '', logger })

  padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)

  padLog(`process bin`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) {
    sizeCodeReduceBin += await processBabel(filePath)
  }
  log(`bin size reduce: ${formatBinary(sizeCodeReduceBin)}B`)

  padLog(`build module`)
  execSync('npm run build-module', execOptionRoot)

  RUN_TEST && padLog(`test module`)
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "output-gitignore/**/*.test.js"`, execOptionRoot)

  padLog(`process module`)
  let sizeFileReduceModule = 0
  let sizeCodeReduceModule = 0
  for (const filePath of await getFileList(fromOutput('module'))) {
    if (REGEXP_DELETE_FILE_PATH.test(filePath)) sizeFileReduceModule += await processDelete(filePath)
    else sizeCodeReduceModule += await processBabel(filePath)
  }
  log(`module size reduce: ${formatBinary(sizeFileReduceModule)}B, ${formatBinary(sizeCodeReduceModule)}B`)

  padLog(`build library-babel`)
  execSync('npm run build-library-babel', execOptionRoot)

  RUN_TEST && padLog('test library-babel')
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "output-gitignore/**/*.test.js"`, execOptionRoot)

  padLog(`process library-babel`)
  let sizeFileReduceLibraryBabel = 0
  let sizeCodeReduceLibraryBabel = 0
  for (const filePath of await getFileList(fromOutput('library'))) {
    if (REGEXP_DELETE_FILE_PATH.test(filePath)) sizeFileReduceLibraryBabel += await processDelete(filePath)
    else sizeCodeReduceLibraryBabel += await processBabel(filePath)
  }
  log(`library-babel size reduce: ${formatBinary(sizeFileReduceLibraryBabel)}B, ${formatBinary(sizeCodeReduceLibraryBabel)}B`)

  padLog(`process webpack output`)
  execSync('npm run build-library-webpack', execOptionRoot)
  const sizeCodeReduceLibraryWebpack = await processWebpack(fromOutput('library/Dr.browser.js'))
  log(`library-webpack size reduce: ${formatBinary(sizeCodeReduceLibraryWebpack)}B`)

  padLog(`total size reduce: ${formatBinary(
    sizeCodeReduceBin +
    sizeFileReduceModule + sizeCodeReduceModule +
    sizeFileReduceLibraryBabel + sizeCodeReduceLibraryBabel +
    sizeCodeReduceLibraryWebpack
  )}B (before pack; test, index file included)`)

  padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  log(`bin test output: \n${stringIndentLine(outputBinTest, '  ')}`)
  for (const testString of [
    packageJSON.name, packageJSON.version,
    process.version, process.platform, process.arch
  ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

runMain(async () => {
  RUN_TEST && padLog('run source test')
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "source/**/*.test.js"`, execOptionRoot)

  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!argvList.includes('pack')) return
  await processSource({ packageJSON })
  await packOutput({ fromRoot, fromOutput, logger })

  argvList.includes('publish') && execSync('npm publish', execOptionOutput)
  argvList.includes('publish-dev') && execSync('npm publish --tag dev', execOptionOutput)
}, logger)
