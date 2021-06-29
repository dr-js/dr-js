import { sep } from 'path'
import { existsSync } from 'fs'

import { collectSourceJsRouteMap } from '@dr-js/dev/module/node/export/parsePreset.js'
import { generateExportInfo, generateIndexScript } from '@dr-js/dev/module/node/export/generate.js'
import { getMarkdownFileLink, renderMarkdownBlockQuote, renderMarkdownAutoAppendHeaderLink, renderMarkdownExportPath, renderMarkdownExportTree } from '@dr-js/dev/module/node/export/renderMarkdown.js'
import { runMain, commonCombo } from '@dr-js/dev/module/main.js'

import { writeJSON, writeText } from 'source/node/fs/File.js'
import { formatUsage } from 'source-bin/option.js'

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

  await writeText(fromRoot('SPEC.md'), [
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
  const writeTempFile = async (path, data) => {
    logger.devLog(`[tempFile] ${path}`)
    await writeText(path, data)
    tempFileList.push(path)
  }
  for (const [ path, data ] of Object.entries(generateIndexScript({ sourceRouteMap }))) await writeTempFile(path, data)
  await writeTempFile(fromRoot('source/Dr.browser.js'), [
    'import * as Env from "source/env/index.js"',
    'import * as Common from "source/common/index.js"',
    'import * as Browser from "source/browser/index.js"',
    'export { Env, Common, Browser }'
  ].join('\n'))
  await writeJSON(PATH_FILE_DELETE_CONFIG, { modifyDelete: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ] })
}, 'generate-spec')
