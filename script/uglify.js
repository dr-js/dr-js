import { resolve as resolvePath } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import UglifyEs from 'uglify-es'
import { loadFlag, checkFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { clock } from 'source/common/time'
import { binary, time, padTable } from 'source/common/format'
import { getFileList } from 'source/node/file/Directory'

const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

const ecma = 8 // specify one of: 5, 6, 7 or 8
const toplevel = true // enable top level variable and function name mangling and to drop unused variables and functions
const MODULE_OPTION = {
  ecma,
  toplevel,
  parse: { ecma },
  compress: { ecma, toplevel, join_vars: false, sequences: false },
  mangle: false,
  output: { ecma, beautify: true, indent_level: 2, width: 240 },
  sourceMap: false
}
const LIBRARY_OPTION = {
  ...MODULE_OPTION,
  mangle: { toplevel },
  output: { ecma, beautify: false, semicolons: false }
}

const minifyWithUglifyEs = (MODE, filePath) => {
  const timeStart = clock()
  const scriptSource = readFileSync(filePath, { encoding: 'utf8' })
  const { error, code: scriptOutput } = UglifyEs.minify(scriptSource, MODE === 'module' ? MODULE_OPTION : LIBRARY_OPTION)
  if (error) {
    console.error(`[minifyWithUglifyEs] failed to minify file: ${filePath}, MODE: ${MODE}`)
    throw error
  }
  writeFileSync(filePath, scriptOutput)

  const timeEnd = clock()
  const sizeSource = Buffer.byteLength(scriptSource)
  const sizeOutput = Buffer.byteLength(scriptOutput)
  const sizeDelta = sizeOutput - sizeSource
  return [
    `∆ ${(100 * sizeDelta / sizeSource).toFixed(2)}% (${binary(sizeDelta)}B)`,
    time(timeEnd - timeStart),
    `${filePath}`
  ]
}

const PAD_FUNC_LIST = [ (delta, width) => delta.padEnd(width), undefined, (filePath) => filePath ]

runMain(async (logger) => {
  const MODE = checkFlag(loadFlag([ 'module', 'library' ]), [ 'module', 'library' ], 'library')
  logger.padLog(`minify with uglify-es, Mode: ${MODE}`)

  const minifyFileList = MODE === 'module'
    ? (await getFileList(fromOutput('module'))).filter((path) => path.endsWith('.js') && !path.endsWith('.test.js'))
    : [
      ...await getFileList(fromOutput('bin')),
      ...await getFileList(fromOutput('library'))
    ].filter((path) => path.endsWith('.js') && !path.endsWith('.test.js') && !path.endsWith('Dr.browser.js'))

  logger.log(`file count: ${minifyFileList.length}`)

  const resultTable = []
  for (const filePath of minifyFileList) resultTable.push(minifyWithUglifyEs(MODE, filePath))
  logger.log(`\n  ${padTable({ table: resultTable, cellPad: ' | ', rowPad: '\n  ', padFuncList: PAD_FUNC_LIST })}`)
}, getLogger(`uglify`))
