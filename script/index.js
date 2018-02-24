import { ok } from 'assert'
import { resolve } from 'path'
import { execSync } from 'child_process'

import { loadFlag, checkFlag, runMain } from 'dev-dep-tool/library/__utils__'
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
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })
  const processWebpack = wrapFileProcessor({ processor: fileProcessorWebpack, logger })
  const processDelete = wrapFileProcessor({ processor: () => '', logger })

  const { padLog, log } = logger

  padLog(`process bin`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) {
    sizeCodeReduceBin += await processBabel(filePath)
  }
  log(`bin size reduce: ${formatBinary(sizeCodeReduceBin)}B`)

  padLog(`process module`)
  let sizeFileReduceModule = 0
  let sizeCodeReduceModule = 0
  for (const filePath of await getFileList(fromOutput('module'))) {
    if (/(\.test|index|Dr|Dr\.node|Dr\.browser)\.js$/.test(filePath)) {
      sizeFileReduceModule += await processDelete(filePath)
    } else sizeCodeReduceModule += await processBabel(filePath)
  }
  log(`module size reduce: ${formatBinary(sizeFileReduceModule)}B, ${formatBinary(sizeCodeReduceModule)}B`)

  padLog(`process library-babel`)
  let sizeFileReduceLibraryBabel = 0
  let sizeCodeReduceLibraryBabel = 0
  for (const filePath of await getFileList(fromOutput('library'))) {
    if (/(\.test|index|Dr|Dr\.node)\.js$/.test(filePath)) {
      sizeFileReduceLibraryBabel += await processDelete(filePath)
    } else sizeCodeReduceLibraryBabel += await processBabel(filePath)
  }
  log(`library-babel size reduce: ${formatBinary(sizeFileReduceLibraryBabel)}B, ${formatBinary(sizeCodeReduceLibraryBabel)}B`)

  padLog(`process library-webpack`)
  const sizeCodeReduceLibraryWebpack = await processWebpack(fromOutput('library/Dr.browser.js'))
  log(`library-webpack size reduce: ${formatBinary(sizeCodeReduceLibraryWebpack)}B`)

  padLog(`total size reduce: ${formatBinary(
    sizeCodeReduceBin +
    sizeFileReduceModule + sizeCodeReduceModule +
    sizeFileReduceLibraryBabel + sizeCodeReduceLibraryBabel +
    sizeCodeReduceLibraryWebpack
  )}B`)
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
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "source/**/*.test.js"`, execOptionRoot)

  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!hasFlag('pack')) return

  await buildOutput({ logger })

  RUN_TEST && logger.padLog(`test output`)
  RUN_TEST && execSync(`cross-env BABEL_ENV=test mocha --require babel-register "output-gitignore/**/*.test.js"`, execOptionRoot)

  await processOutput({ packageJSON, logger })
  await verifyOutput({ packageJSON, logger })

  await packOutput({ fromRoot, fromOutput, logger })

  hasFlag('publish') && execSync('npm publish', execOptionOutput)
  hasFlag('publish-dev') && execSync('npm publish --tag dev', execOptionOutput)
}, getLogger([ 'dr-js', ...FLAG_LIST ].join('|')))
