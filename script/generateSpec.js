import { sep } from 'node:path'

import { collectSourceJsRouteMap } from '@dr-js/dev/module/node/export/parsePreset.js'
import { generateExportInfo, generateIndexScript } from '@dr-js/dev/module/node/export/generate.js'
import { getMarkdownFileLink, renderMarkdownBlockQuote, renderMarkdownAutoAppendHeaderLink, renderMarkdownExportPath, renderMarkdownExportTree } from '@dr-js/dev/module/node/export/renderMarkdown.js'

import { readJSON, writeJSON, writeText } from 'source/node/fs/File.js'
import { existPathSync } from 'source/node/fs/Path.js'
import { modifyDelete } from 'source/node/fs/Modify.js'
import { runKit } from 'source/node/kit.js'

import { formatUsage } from 'source-bin/option.js'

require.main === module && runKit(async (kit) => {
  kit.padLog('generate exportInfoMap')
  const sourceRouteMap = await collectSourceJsRouteMap({ pathRootList: [ kit.fromRoot('source') ], kit })
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  kit.padLog('output: SPEC.md')
  const initRouteList = kit.fromRoot('source').split(sep)

  await writeText(kit.fromRoot('SPEC.md'), [
    '# Specification',
    '',
    ...renderMarkdownAutoAppendHeaderLink(
      '#### Export Path',
      ...renderMarkdownExportPath({ exportInfoMap, rootPath: kit.fromRoot() }),
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
}, { title: 'generate-spec' })

const FILE_TEMP_FILE_DELETE = './TEMP_FILE_DELETE.json'

const createWebpackIndexFile = async (kit) => {
  const PATH_FILE_DELETE_CONFIG = kit.fromRoot(FILE_TEMP_FILE_DELETE)
  await deleteWebpackIndexFile(kit)

  kit.padLog('generate exportInfoMap')
  const sourceRouteMap = await collectSourceJsRouteMap({ pathRootList: [ kit.fromRoot('source') ], kit })

  kit.padLog(`output: ${FILE_TEMP_FILE_DELETE}`)
  const tempFileList = []
  const writeTempFile = async (path, data) => {
    kit.devLog(`[tempFile] ${path}`)
    await writeText(path, data)
    tempFileList.push(path)
  }
  for (const [ path, data ] of Object.entries(generateIndexScript({ sourceRouteMap }))) await writeTempFile(path, data)
  await writeTempFile(kit.fromRoot('source/Dr.browser.js'), [
    'import * as Env from "source/env/index.js"',
    'import * as Common from "source/common/index.js"',
    'import * as Browser from "source/browser/index.js"',
    'export { Env, Common, Browser }'
  ].join('\n'))
  await writeJSON(PATH_FILE_DELETE_CONFIG, { deleteList: [ ...tempFileList, PATH_FILE_DELETE_CONFIG ] })
}

const deleteWebpackIndexFile = async (kit) => {
  const PATH_FILE_DELETE_CONFIG = kit.fromRoot(FILE_TEMP_FILE_DELETE)
  if (!existPathSync(PATH_FILE_DELETE_CONFIG)) return

  kit.padLog('[clear] delete previous temp build file')
  const { deleteList } = await readJSON(PATH_FILE_DELETE_CONFIG)
  for (const file of deleteList) await modifyDelete(file)
}

export {
  createWebpackIndexFile,
  deleteWebpackIndexFile
}
