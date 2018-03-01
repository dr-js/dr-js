import { resolve as resolvePath } from 'path'
import { loadFlag, checkFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { MODULE_OPTION, LIBRARY_OPTION, minifyWithUglifyEs } from 'dev-dep-tool/library/uglify'

import { binary, time, padTable } from 'source/common/format'
import { getFileList } from 'source/node/file/Directory'

const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

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
  for (const filePath of minifyFileList) {
    const { sizeSource, sizeOutput, timeStart, timeEnd } = minifyWithUglifyEs({ filePath, option: MODE === 'module' ? MODULE_OPTION : LIBRARY_OPTION, logger })
    const sizeDelta = sizeOutput - sizeSource
    resultTable.push([
      `∆ ${(100 * sizeDelta / sizeSource).toFixed(2)}% (${binary(sizeDelta)}B)`,
      time(timeEnd - timeStart),
      `${filePath}`
    ])
  }
  logger.log(`\n  ${padTable({
    table: resultTable,
    cellPad: ' | ',
    rowPad: '\n  ',
    padFuncList: [ (delta, width) => delta.padEnd(width), undefined, (filePath) => filePath ]
  })}`)
}, getLogger(`uglify`))
