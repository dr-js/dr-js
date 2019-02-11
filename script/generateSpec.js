import { resolve, sep } from 'path'
import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'

import { argvFlag, runMain } from 'dr-dev/module/main'
import { getLogger } from 'dr-dev/module/logger'
import { collectSourceRouteMap } from 'dr-dev/module/ExportIndex/parseExport'
import { generateIndexScript, generateExportInfo } from 'dr-dev/module/ExportIndex/generateInfo'
import { autoAppendMarkdownHeaderLink, renderMarkdownFileLink, renderMarkdownExportPath, renderMarkdownExportTree } from 'dr-dev/module/ExportIndex/renderMarkdown'

import { indentLine } from 'source/common/string'

import { formatUsage } from 'source-bin/option'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const [
  ,
  ,
  PATH_FILE_DELETE_CONFIG_RAW
] = process.argv

const PATH_FILE_DELETE_CONFIG = resolve(process.cwd(), PATH_FILE_DELETE_CONFIG_RAW)

const renderMarkdownBinOptionFormat = () => [
  renderMarkdownFileLink('source-bin/option.js'),
  '> ```',
  indentLine(formatUsage(), '> '),
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

  writeFileSync(PATH_FILE_DELETE_CONFIG, JSON.stringify({
    drJsFileModifyDelete: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ],
    drJsQuiet: true
  }))
}

runMain(async (logger) => {
  if (existsSync(PATH_FILE_DELETE_CONFIG)) {
    logger.padLog(`[clear] delete previous temp build file`)
    execSync('npm run script-delete-temp-build-file', { cwd: fromRoot(), stdio: 'ignore', shell: true })
  }

  logger.padLog(`collect sourceRouteMap`)
  const sourceRouteMap = await collectSourceRouteMap({ pathRootList: [ fromRoot('source') ], logger })

  logger.padLog(`generate exportInfo`)
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.log(`output: SPEC.md`)
  const initRouteList = fromRoot('source').split(sep)
  writeFileSync(fromRoot('SPEC.md'), [
    '# Specification',
    '',
    ...autoAppendMarkdownHeaderLink(
      '#### Export Path',
      ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT }),
      '',
      '#### Export Tree',
      ...renderMarkdownExportTree({ exportInfo: exportInfoMap[ initRouteList.join('/') ], routeList: initRouteList }),
      '',
      '#### Bin Option Format',
      ...renderMarkdownBinOptionFormat()
    ),
    ''
  ].join('\n'))

  logger.log(`output: ${PATH_FILE_DELETE_CONFIG_RAW}`)
  generateTempFile({ sourceRouteMap, logger })
}, getLogger('generate-spec', argvFlag('quiet')))
