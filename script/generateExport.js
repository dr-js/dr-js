import { resolve, sep } from 'path'
import { writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

import { runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { createExportParser } from 'dev-dep-tool/library/ExportIndex/parseExport'
import { generateIndexScript, generateExportInfo } from 'dev-dep-tool/library/ExportIndex/generateInfo'
import { renderMarkdownExportPath, renderMarkdownExportTree } from 'dev-dep-tool/library/ExportIndex/renderMarkdown'

import { getDirectoryContent, walkDirectoryContent } from 'source/node/file/Directory'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const collectSourceRouteMap = async ({ logger }) => {
  const { parseExport, getSourceRouteMap } = createExportParser({ logger })

  await parseExport(fromRoot('source', 'env.js'))
  await parseExport(fromRoot('source', 'common'))
  await parseExport(fromRoot('source', 'node'))
  await parseExport(fromRoot('source', 'browser'))

  const parseWalkExport = (path, name) => parseExport(resolve(path, name))
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/common')), parseWalkExport)
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/node')), parseWalkExport)
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/browser')), parseWalkExport)

  return getSourceRouteMap()
}

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
    mode: 'file-modify-delete',
    argument: [ ...tempFileList, 'tempFileDelete.config.json' ]
  }))
}

runMain(async (logger) => {
  if (existsSync(fromRoot('tempFileDelete.config.json'))) {
    logger.log(`[clear] delete previous temp build file`)
    execSync('npm run script-delete-temp-build-file', { cwd: fromRoot(), stdio: 'ignore', shell: true })
  }

  logger.log(`collect sourceRouteMap`)
  const sourceRouteMap = await collectSourceRouteMap({ logger })

  logger.log(`generate exportInfo`)
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.log(`output: EXPORT_INFO.md`)
  const initRouteList = fromRoot('source').split(sep)
  writeFileSync(fromRoot('EXPORT_INFO.md'), [
    '# Export Info',
    '',
    '* [Export Path](#export-path)',
    '* [Export Tree](#export-tree)',
    '',
    '#### Export Path',
    ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT }),
    '',
    '#### Export Tree',
    ...renderMarkdownExportTree({ exportInfo: exportInfoMap[ initRouteList.join('/') ], routeList: initRouteList })
  ].join('\n'))

  logger.log(`output: tempFileDelete.config.json`)
  generateTempFile({ sourceRouteMap, logger })
}, getLogger('generate-export'))
