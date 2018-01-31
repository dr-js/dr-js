import { ok } from 'assert'
import { statSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

import { oneOf } from 'source/common/verify'
import { binary as formatBinary, stringIndentLine } from 'source/common/format'
import { createDirectory } from 'source/node/file/File'
import { getFileList } from 'source/node/file/Directory'
import { modify } from 'source/node/file/Modify'

import { fromRoot, fromOutput, getLogger, wrapFileProcessor } from './__utils__'

const [ , , MODE = 'init-only', SKIP_TEST = false ] = process.argv
oneOf(MODE, [ 'init-only', 'pack-only', 'test-only', 'publish', 'publish-dev' ])

const TEST = !SKIP_TEST || [ 'test-only', 'publish', 'publish-dev' ].includes(MODE)

const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }
const { log, padLog } = getLogger(` [dr-js|${MODE}]`)

const REGEXP_DELETE_FILE_PATH = /(\.test|index|Dr|Dr\.node|Dr\.browser)\.js$/
const deleteProcessor = async (filePath) => {
  const { size } = statSync(filePath)
  await modify.delete(filePath)
  log(`delete [-${formatBinary(size)}B] | ${filePath}`)
  return size
}
const babelProcessor = wrapFileProcessor(
  (inputString) => inputString
    .replace(/['"]use strict['"];\s+/g, '')
    .replace(/Object\.defineProperty\(exports, ['"]__esModule['"], {\s+value: true\s+}\);\s+/g, '') // .replace(/{\s+value: true\s+}/g, '{value:true}')
    .replace(/(exports\.\w+ = )+undefined;\s+/g, '')
    .replace(/[\n\r]{2,}/g, '\n'),
  log
)
const webpackProcessor = wrapFileProcessor(
  (inputString) => inputString
    .replace(/function\(\){return (\w+)}/g, '()=>$1'),
  log
)

const main = async () => {
  TEST && padLog('run source test')
  TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "source/**/*.test.js"`, execOptionRoot)

  const packageJSON = await initOutput()
  if (MODE === 'init-only') return

  await processSource(packageJSON)
  if (MODE === 'test-only') return

  await packOutput(packageJSON)
  if (MODE === 'pack-only') return

  padLog(MODE)
  MODE === 'publish' && execSync('npm publish', execOptionOutput)
  MODE === 'publish-dev' && execSync('npm publish --tag dev', execOptionOutput)
}

const initOutput = async () => {
  padLog('reset output')
  await modify.delete(fromOutput()).catch(() => {})
  await createDirectory(fromOutput())

  padLog(`create package.json`)
  const packageJSON = require('../package.json')
  const deleteKeyList = [ 'private', 'scripts', 'engines', 'devDependencies' ]
  log(`delete ${deleteKeyList}`)
  for (const deleteKey of deleteKeyList) delete packageJSON[ deleteKey ]
  writeFileSync(fromOutput('package.json'), JSON.stringify(packageJSON))

  const copyPathList = [ 'LICENSE', 'README.md' ]
  padLog(`copy ${copyPathList}`)
  for (const copyPath of copyPathList) await modify.copy(fromRoot(copyPath), fromOutput(copyPath))

  return packageJSON
}

const processSource = async (packageJSON) => {
  padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)

  padLog(`process bin`)
  let sizeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) {
    sizeReduceBin += await babelProcessor(filePath)
  }
  log(`bin size reduce: ${formatBinary(sizeReduceBin)}B`)

  padLog(`build module`)
  execSync('npm run build-module', execOptionRoot)

  TEST && padLog(`test module`)
  TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "output-gitignore/**/*.test.js"`, execOptionRoot)

  padLog(`process module`)
  let sizeReduceModule = 0
  for (const filePath of await getFileList(fromOutput('module'))) {
    if (REGEXP_DELETE_FILE_PATH.test(filePath)) sizeReduceModule += await deleteProcessor(filePath)
    else sizeReduceModule += await babelProcessor(filePath)
  }
  log(`module size reduce: ${formatBinary(sizeReduceModule)}B`)

  padLog(`build library-babel`)
  execSync('npm run build-library-babel', execOptionRoot)

  TEST && padLog('test library-babel')
  TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "output-gitignore/**/*.test.js"`, execOptionRoot)

  padLog(`process library-babel`)
  let sizeReduceLibraryBabel = 0
  for (const filePath of await getFileList(fromOutput('library'))) {
    if (REGEXP_DELETE_FILE_PATH.test(filePath)) sizeReduceLibraryBabel += await deleteProcessor(filePath)
    else sizeReduceLibraryBabel += await babelProcessor(filePath)
  }
  log(`library-babel size reduce: ${formatBinary(sizeReduceLibraryBabel)}B`)

  padLog(`process webpack output`)
  execSync('npm run build-library-webpack', execOptionRoot)
  const sizeReduceLibraryWebpack = await webpackProcessor(fromOutput('library/Dr.browser.js'))
  log(`library-webpack size reduce: ${formatBinary(sizeReduceLibraryWebpack)}B`)

  padLog(`total size reduce: ${formatBinary(
    sizeReduceBin +
    sizeReduceModule +
    sizeReduceLibraryBabel +
    sizeReduceLibraryWebpack
  )}B (before pack; test, index file included)`)

  padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  log(`bin test output: \n${stringIndentLine(outputBinTest, '  ')}`)
  for (const testString of [
    packageJSON.name, packageJSON.version,
    process.version, process.platform, process.arch
  ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

const packOutput = async (packageJSON) => {
  padLog('run pack')
  execSync('npm pack', execOptionOutput)
  const outputFileName = `${packageJSON.name}-${packageJSON.version}.tgz`
  await modify.move(fromOutput(outputFileName), fromRoot(outputFileName))
  log(`pack size: ${formatBinary(statSync(fromRoot(outputFileName)).size)}B`)
}

main().then(() => {
  padLog(`done`)
}, (error) => {
  padLog(`error`)
  console.warn(error)
  process.exit(-1)
})
