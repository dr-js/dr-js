import { resolve, sep } from 'path'
import { writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

import { collectSourceJsRouteMap } from '@dr-js/dev/module/node/export/parsePreset.js'
import { generateExportInfo, generateIndexScript } from '@dr-js/dev/module/node/export/generate.js'
import { getMarkdownFileLink, renderMarkdownBlockQuote, renderMarkdownAutoAppendHeaderLink, renderMarkdownExportPath, renderMarkdownExportTree } from '@dr-js/dev/module/node/export/renderMarkdown.js'
import { runMain } from '@dr-js/dev/module/main.js'

import { formatUsage } from 'source-bin/option.js'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const [
  , // node
  , // script.js
  PATH_FILE_DELETE_CONFIG_RAW
] = process.argv

const PATH_FILE_DELETE_CONFIG = resolve(PATH_FILE_DELETE_CONFIG_RAW)

const generateTempFile = ({ indexScriptMap, logger }) => {
  const tempFileList = []
  const writeTempFile = (path, data) => {
    logger.devLog(`[tempFile] ${path}`)
    writeFileSync(path, data)
    tempFileList.push(path)
  }
  Object.entries(indexScriptMap).forEach(([ path, data ]) => writeTempFile(path, data))
  writeTempFile(fromRoot('source/Dr.browser.js'), [
    'import * as Env from "source/env"',
    'import * as Common from "source/common"',
    'import * as Browser from "source/browser"',
    'export { Env, Common, Browser }'
  ].join('\n'))
  writeFileSync(PATH_FILE_DELETE_CONFIG, JSON.stringify({ modifyDelete: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ] }))
}

runMain(async (logger) => {
  if (existsSync(PATH_FILE_DELETE_CONFIG)) {
    logger.padLog('[clear] delete previous temp build file')
    execSync('npm run script-delete-temp-build-file', { cwd: fromRoot(), stdio: 'ignore' })
  }

  logger.padLog('generate exportInfoMap')
  const sourceRouteMap = await collectSourceJsRouteMap({ pathRootList: [ fromRoot('source') ], logger })
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.padLog('output: SPEC.md')
  const initRouteList = fromRoot('source').split(sep)

  writeFileSync(fromRoot('SPEC.md'), [
    '# Specification',
    '',
    ...renderMarkdownAutoAppendHeaderLink(
      '#### Export Path',
      ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT }),
      '',
      '#### Export Tree',
      ...renderMarkdownExportTree({ exportInfo: exportInfoMap[ initRouteList.join('/') ], routeList: initRouteList }),
      '',
      '#### Bin Option Format',
      getMarkdownFileLink('source-bin/option.js'),
      ...renderMarkdownBlockQuote(formatUsage())
    ),
    ''
  ].join('\n'))

  logger.padLog(`output: ${PATH_FILE_DELETE_CONFIG_RAW}`)
  generateTempFile({ indexScriptMap: generateIndexScript({ sourceRouteMap }), logger })
}, 'generate-spec')
