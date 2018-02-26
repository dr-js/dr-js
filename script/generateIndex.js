import { resolve, relative, sep } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

import { runMain } from 'dev-dep-tool/library/__utils__'
import { getLogger } from 'dev-dep-tool/library/logger'

import { FILE_TYPE } from 'source/node/file/File'
import { getDirectoryContent, walkDirectoryContent } from 'source/node/file/Directory'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }

const isUpperCaseName = (name) => {
  const leadCharCode = name.charCodeAt(0)
  return leadCharCode >= CHAR_CODE_A && leadCharCode <= CHAR_CODE_Z
}
const CHAR_CODE_A = 'A'.charCodeAt(0)
const CHAR_CODE_Z = 'Z'.charCodeAt(0)

const compareFileName = ({ name: A }, { name: B }) => (
  (isUpperCaseName(A) ? A.charCodeAt(0) - 255 : A.charCodeAt(0)) -
  (isUpperCaseName(B) ? B.charCodeAt(0) - 255 : B.charCodeAt(0))
)

const toExportName = (name) => `${name[ 0 ].toUpperCase()}${name.slice(1)}`

const REGEXP_EXPORT = /export {([\s\w,]+)}/g
const collectSourceRouteMap = async ({ logger }) => {
  const sourceRouteMap = {
    // 'source/route': {
    //   routeList: [ 'source' ],
    //   directoryList: [ /* name */ ],
    //   fileList: [ /* { name, exportList } */ ]
    // }
  }
  const getRoute = (routeList) => {
    const key = routeList.join('/')
    if (!sourceRouteMap[ key ]) sourceRouteMap[ key ] = { routeList, directoryList: [], fileList: [] }
    return sourceRouteMap[ key ]
  }
  const parseExport = (path, name, fileType) => {
    const routeList = relative(PATH_ROOT, path).split(sep)
    if (FILE_TYPE.Directory === fileType) {
      getRoute(routeList).directoryList.push(name)
      logger.devLog(`[directory] ${routeList.join('/')}/${name}`)
    } else if (FILE_TYPE.File === fileType && name.endsWith('.js') && !name.endsWith('.test.js')) {
      const fileString = readFileSync(resolve(path, name), { encoding: 'utf8' })
      const [ , exportString ] = REGEXP_EXPORT.exec(fileString)
      if (name === 'index.js') throw new Error(`unexpected 'index.js': ${routeList.join('/')}/${name}`)
      if (REGEXP_EXPORT.exec(fileString)) throw new Error(`unexpected extra export in: ${routeList.join('/')}/${name}`)
      const exportList = exportString
        .replace(/\w+ as /g, '')
        .replace(/\s+/g, '')
        .split(',')
      getRoute(routeList).fileList.push({ name: name.slice(0, -3), exportList }) // remove `.js` from name
      logger.devLog(`[file]      ${routeList.join('/')}/${name}`)
      logger.devLog(` - export #${exportList.length}: ${JSON.stringify(exportList)}`)
    } else {
      logger.log(`[skipped]   ${routeList.join('/')}/${name} (${fileType})`)
    }
  }

  parseExport(fromRoot('source'), 'env.js', FILE_TYPE.File)
  parseExport(fromRoot('source'), 'common', FILE_TYPE.Directory)
  parseExport(fromRoot('source'), 'node', FILE_TYPE.Directory)
  parseExport(fromRoot('source'), 'browser', FILE_TYPE.Directory)
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/common')), parseExport)
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/node')), parseExport)
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source/browser')), parseExport)
  // console.log(JSON.stringify(sourceRouteMap, null, '  '))

  return { sourceRouteMap }
}

// for mixed content Directory or upper-case-named File
// merge export:
//    import * as Aaa from './aaa'
//    import * as Bbb from './Bbb'
//    export { Aaa, Bbb }

// for lowerC-cased-named File
// hoist export:
//    export { a1, a2 } from './aaa'
//    export { b1, b2 } from './Bbb'
const generateExportInfo = ({ sourceRouteMap, logger }) => {
  const exportInfoMap = {}
  const getExportInfo = (...routeList) => {
    const key = routeList.join('/')
    if (!exportInfoMap[ key ]) exportInfoMap[ key ] = {}
    return exportInfoMap[ key ]
  }

  Object.values(sourceRouteMap).forEach(({ routeList, directoryList, fileList }) => {
    const exportInfo = getExportInfo(...routeList)

    directoryList.forEach((name) => {
      exportInfo[ toExportName(name) ] = getExportInfo(...routeList, name)
    })

    fileList.sort(compareFileName).map(({ name, exportList }) => {
      const shouldMergeExport = directoryList.length || isUpperCaseName(name)
      if (shouldMergeExport) {
        exportInfo[ toExportName(name) ] = { [ EXPORT_LIST_KEY ]: exportList }
      } else {
        exportInfo[ name ] = { [ HOIST_LIST_KEY ]: exportList }
        exportInfo[ EXPORT_HOIST_LIST_KEY ] = [ ...(exportInfo[ EXPORT_HOIST_LIST_KEY ] || []), ...exportList ]
      }
      getExportInfo(...routeList, name)[ EXPORT_LIST_KEY ] = exportList
    })
  })
  // writeFileSync(fromRoot('dev-sourceRouteMap-gitignore.json'), JSON.stringify(sourceRouteMap, null, '  '))
  // writeFileSync(fromRoot('dev-exportInfo-gitignore.json'), JSON.stringify(exportInfoMap, null, '  '))

  logger.log(`[doc] exportTree.md`)
  writeFileSync(fromRoot('exportTree.md'), parseExportTree(exportInfoMap[ 'source' ], []).join('\n'))

  logger.log(`[doc] exportPath.md`)
  writeFileSync(fromRoot('exportPath.md'), parseExportPath(exportInfoMap).join('\n'))
}

const generateTempFile = ({ sourceRouteMap, logger }) => {
  const tempFileList = []
  const writeTempFile = (path, data) => {
    logger.devLog(`[tempFile] ${path}`)
    writeFileSync(path, data)
    tempFileList.push(path)
  }

  Object.values(sourceRouteMap).forEach(({ routeList, directoryList, fileList }) => {
    const textList = []
    const importList = []

    directoryList.forEach((name) => {
      const exportName = toExportName(name)
      textList.push(`import * as ${exportName} from './${name}'`)
      importList.push(exportName)
    })
    fileList.sort(compareFileName).map(({ name, exportList }) => {
      const shouldMergeExport = directoryList.length || isUpperCaseName(name)

      if (shouldMergeExport) {
        const exportName = toExportName(name)
        textList.push(`import * as ${exportName} from './${name}'`)
        importList.push(exportName)
      } else {
        textList.push(`export { ${exportList.join(', ')} } from './${name}'`)
      }
    })
    importList.length && textList.push(`export { ${importList.join(', ')} }`)

    textList.push('')
    writeTempFile(fromRoot(...routeList, 'index.js'), textList.join('\n'))
  })

  writeTempFile(fromRoot('source/Dr.browser.js'), [
    `import * as Env from 'source/env'`,
    `import * as Common from 'source/common'`,
    `import * as Browser from 'source/browser'`,
    `export { Env, Common, Browser }`,
    ''
  ].join('\n'))

  logger.log(`save tempFileList to tempFileDelete.config.json`)
  writeFileSync(fromRoot('tempFileDelete.config.json'), JSON.stringify({
    mode: 'file-modify-delete',
    argument: [ ...tempFileList, 'tempFileDelete.config.json' ]
  }))
}

const EXPORT_LIST_KEY = '@@|export'
const EXPORT_HOIST_LIST_KEY = '@@|export-hoist'
const HOIST_LIST_KEY = '@@|hoist'

const parseExportTree = (exportInfo, routeList) => {
  const textList = []
  Object.entries(exportInfo).forEach(([ key, value ]) => {
    if (key === HOIST_LIST_KEY) {
      // skip
    } else if (key === EXPORT_LIST_KEY || key === EXPORT_HOIST_LIST_KEY) {
      // textList.push(...value.map((text) => `- \`${text}\``))
      textList.push(`- ${value.map((text) => `\`${text}\``).join(', ')}`)
    } else {
      const childTextList = parseExportTree(value, [ ...routeList, key ])
      if (!childTextList.length) return
      textList.push(`- **${key}**`)
      textList.push(...childTextList.map((text) => `  ${text}`))
    }
  })
  return textList
}

const parseExportPath = (exportInfoMap) => {
  const textList = []
  Object.entries(exportInfoMap).forEach(([ key, value ]) => {
    if (!value[ EXPORT_LIST_KEY ]) return
    textList.push(`+ 📄 [${key.replace(/_/g, '\\_')}.js](${key}.js)`)
    textList.push(`  - ${value[ EXPORT_LIST_KEY ].map((text) => `\`${text}\``).join(', ')}`)
  })
  return textList
}

runMain(async (logger) => {
  if (existsSync(fromRoot('tempFileDelete.config.json'))) {
    logger.padLog(`[clear-leftover] delete temp build file`)
    execSync('npm run script-delete-temp-build-file', execOptionRoot)
  }

  logger.padLog(`collect sourceRouteMap`)
  const { sourceRouteMap } = await collectSourceRouteMap({ logger })

  logger.padLog(`generate exportInfo`)
  generateExportInfo({ sourceRouteMap, logger })

  logger.padLog(`generate temp build files`)
  generateTempFile({ sourceRouteMap, logger })
}, getLogger('generate-index'))
