import { sep } from 'path'
import { existsSync } from 'fs'

import { collectSourceJsRouteMap } from '@dr-js/dev/module/node/export/parsePreset.js'
import { generateExportInfo, generateIndexScript } from '@dr-js/dev/module/node/export/generate.js'
import { getMarkdownFileLink, renderMarkdownBlockQuote, renderMarkdownAutoAppendHeaderLink, renderMarkdownExportPath, renderMarkdownExportTree } from '@dr-js/dev/module/node/export/renderMarkdown.js'
import { runMain, commonCombo } from '@dr-js/dev/module/main.js'

import { readJSON, writeJSON, writeText } from 'source/node/fs/File.js'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { formatUsage } from 'source-bin/option.js'

require.main === module && runMain(async (logger) => {
  const { fromRoot } = commonCombo(logger)

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
}, 'generate-spec')

const FILE_TEMP_FILE_DELETE = './TEMP_FILE_DELETE.json'

const createWebpackIndexFile = async ({ fromRoot, logger }) => {
  const PATH_FILE_DELETE_CONFIG = fromRoot(FILE_TEMP_FILE_DELETE)
  await deleteWebpackIndexFile({ fromRoot, logger })

  logger.padLog('generate exportInfoMap')
  const sourceRouteMap = await collectSourceJsRouteMap({ pathRootList: [ fromRoot('source') ], logger })

  logger.padLog(`output: ${FILE_TEMP_FILE_DELETE}`)
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
  await writeJSON(PATH_FILE_DELETE_CONFIG, { deleteList: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ] })
}

const deleteWebpackIndexFile = async ({ fromRoot, logger }) => {
  const PATH_FILE_DELETE_CONFIG = fromRoot(FILE_TEMP_FILE_DELETE)
  if (!existsSync(PATH_FILE_DELETE_CONFIG)) return

  logger.padLog('[clear] delete previous temp build file')
  const { deleteList } = await readJSON(PATH_FILE_DELETE_CONFIG)
  for (const file of deleteList) await modifyDelete(file)
}

export {
  createWebpackIndexFile,
  deleteWebpackIndexFile
}
