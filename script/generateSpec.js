import { sep } from 'path'
import { existsSync } from 'fs'

import { collectSourceJsRouteMap } from '@dr-js/dev/module/node/export/parsePreset'
import { generateExportInfo, generateIndexScript } from '@dr-js/dev/module/node/export/generate'
import { getMarkdownFileLink, renderMarkdownBlockQuote, renderMarkdownAutoAppendHeaderLink, renderMarkdownExportPath, renderMarkdownExportTree } from '@dr-js/dev/module/node/export/renderMarkdown'
import { runMain, commonCombo, writeFileSync } from '@dr-js/dev/module/main'

import { formatUsage } from 'source-bin/option'

const [
  , // node
  , // script.js
  PATH_FILE_DELETE_CONFIG_RAW
] = process.argv

runMain(async (logger) => {
  const { fromRoot, RUN } = commonCombo(logger)

  const PATH_FILE_DELETE_CONFIG = fromRoot(PATH_FILE_DELETE_CONFIG_RAW)
  if (existsSync(PATH_FILE_DELETE_CONFIG)) {
    logger.padLog('[clear] delete previous temp build file')
    RUN('npm run script-delete-temp-build-file')
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
      ...renderMarkdownExportPath({ exportInfoMap, rootPath: fromRoot() }),
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
  const tempFileList = []
  const writeTempFile = (path, data) => {
    logger.devLog(`[tempFile] ${path}`)
    writeFileSync(path, data)
    tempFileList.push(path)
  }
  Object.entries(generateIndexScript({ sourceRouteMap }))
    .forEach(([ path, data ]) => writeTempFile(path, data))
  writeTempFile(fromRoot('source/Dr.browser.js'), [
    'import * as Env from "source/env"',
    'import * as Common from "source/common"',
    'import * as Browser from "source/browser"',
    'export { Env, Common, Browser }'
  ].join('\n'))
  writeFileSync(PATH_FILE_DELETE_CONFIG, JSON.stringify({ modifyDelete: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ] }))
}, 'generate-spec')
