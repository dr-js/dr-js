import { resolve, sep } from 'path'
import { writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { createExportParser } from 'dev-dep-tool/library/ExportIndex/parseExport'
import { generateIndexScript, generateExportInfo } from 'dev-dep-tool/library/ExportIndex/generateInfo'
import { renderMarkdownFileLink, renderMarkdownExportPath, renderMarkdownExportTree } from 'dev-dep-tool/library/ExportIndex/renderMarkdown'

import { stringIndentLine } from 'source/common/format'
import { getDirectoryInfoTree, walkDirectoryInfoTree } from 'source/node/file/Directory'
import { formatUsage } from 'source-bin/option'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const collectSourceRouteMap = async ({ logger }) => {
  const { parseExport, getSourceRouteMap } = createExportParser({ logger })
  const parseWalkExport = ({ path }) => parseExport(path)
  await walkDirectoryInfoTree(await getDirectoryInfoTree(fromRoot('source')), parseWalkExport)
  return getSourceRouteMap()
}

const renderMarkdownBinOptionFormat = () => [
  renderMarkdownFileLink('source-bin/option.js'),
  '> ```',
  stringIndentLine(formatUsage(), '> '),
  '> ```'
]

const generateTempFile = ({ sourceRouteMap, logger }) => {
  const tempFileList = []
  const writeTempFile = (path, data) => {
    logger.devLog(`[tempFile] ${path}`)
    writeFileSync(path, data)
    tempFileList.push(path)
  }

  const indexScriptMap = generateIndexScript({ sourceRouteMap })
  Object.entries(indexScriptMap).forEach(([ path, data ]) => writeTempFile(path, data))

  writeTempFile(fromRoot('source/Dr.browser.js'), [
    `import * as Env from 'source/env'`,
    `import * as Common from 'source/common'`,
    `import * as Browser from 'source/browser'`,
    `export { Env, Common, Browser }`
  ].join('\n'))

  writeFileSync(fromRoot('tempFileDelete.config.json'), JSON.stringify({
    drJsFileModifyDelete: [ ...tempFileList, 'tempFileDelete.config.json' ],
    drJsQuiet: true
  }))
}

runMain(async (logger) => {
  if (existsSync(fromRoot('tempFileDelete.config.json'))) {
    logger.padLog(`[clear] delete previous temp build file`)
    execSync('npm run script-delete-temp-build-file', { cwd: fromRoot(), stdio: 'ignore', shell: true })
  }

  logger.padLog(`collect sourceRouteMap`)
  const sourceRouteMap = await collectSourceRouteMap({ logger })

  logger.padLog(`generate exportInfo`)
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.log(`output: SPEC.md`)
  const initRouteList = fromRoot('source').split(sep)
  writeFileSync(fromRoot('SPEC.md'), [
    '# Specification',
    '',
    '* [Export Path](#export-path)',
    '* [Export Tree](#export-tree)',
    '* [Bin Option Format](#bin-option-format)',
    '',
    '#### Export Path',
    ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT }),
    '',
    '#### Export Tree',
    ...renderMarkdownExportTree({ exportInfo: exportInfoMap[ initRouteList.join('/') ], routeList: initRouteList }),
    '',
    '#### Bin Option Format',
    ...renderMarkdownBinOptionFormat(),
    ''
  ].join('\n'))

  logger.log(`output: tempFileDelete.config.json`)
  generateTempFile({ sourceRouteMap, logger })
}, getLogger('generate-spec', argvFlag('quiet')))
