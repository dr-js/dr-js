import { resolve, relative, sep } from 'path'
import { writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

import { runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'
import { createExportParser } from 'dev-dep-tool/library/ExportIndex/parseExport'
import {
  generateIndexScript,
  HOIST_LIST_KEY, EXPORT_LIST_KEY, EXPORT_HOIST_LIST_KEY, generateExportInfo
} from 'dev-dep-tool/library/ExportIndex/generateInfo'

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
const renderExportPath = (exportInfoMap) => Object.entries(exportInfoMap).reduce((textList, [ path, value ]) => {
  path = relative(PATH_ROOT, path).split(sep).join('/')
  value[ EXPORT_LIST_KEY ] && textList.push(
    `+ 📄 [${path.replace(/_/g, '\\_')}.js](${path}.js)`,
    `  - ${value[ EXPORT_LIST_KEY ].map((text) => `\`${text}\``).join(', ')}`
  )
  return textList
}, [])

const renderExportTree = (exportInfo, routeList) => Object.entries(exportInfo).reduce((textList, [ key, value ]) => {
  if (key === HOIST_LIST_KEY) {
    // skip
  } else if (key === EXPORT_LIST_KEY || key === EXPORT_HOIST_LIST_KEY) {
    textList.push(`- ${value.map((text) => `\`${text}\``).join(', ')}`)
  } else {
    const childTextList = renderExportTree(value, [ ...routeList, key ])
    childTextList.length && textList.push(`- **${key}**`, ...childTextList.map((text) => `  ${text}`))
  }
  return textList
}, [])

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
    ...renderExportPath(exportInfoMap),
    '',
    '#### Export Tree',
    ...renderExportTree(exportInfoMap[ initRouteList.join('/') ], initRouteList)
  ].join('\n'))

  logger.log(`output: tempFileDelete.config.json`)
  generateTempFile({ sourceRouteMap, logger })
}, getLogger('generate-export'))
