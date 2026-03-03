const toExportName = (name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`
const isFirstUpperCase = (name) => /[A-Z]/.test(name.charAt(0))

// for mixed-content Directory or upper-case-named File
// merge export:
//   import * as Aaa from './aaa/index.js'
//   import * as Bbb from './Bbb.js'
//   export { Aaa, Bbb }
//
// for lower-cased-named File
// hoist export:
//   export { c1, c2 } from './ccc.js'
//   export { d1, d2 } from './ddd.js'

const generateIndexScript = ({ sourceRouteMap }) => {
  const indexScriptMap = {
    // [ indexScriptPath ]: 'code'
  }

  Object.values(sourceRouteMap).forEach(({ routeList, directoryList, fileList }) => {
    const textList = []
    const importList = []

    directoryList.forEach((name) => { // merge: mixed-content Directory
      const exportName = toExportName(name)
      textList.push(`import * as ${exportName} from './${name}/index.js'`)
      importList.push(exportName)
    })

    fileList.forEach(({ name, exportList }) => {
      if (
        directoryList.length || // merge: File in mixed-content Directory
        isFirstUpperCase(name) // merge: upper-case-named File
      ) {
        const exportName = toExportName(name)
        textList.push(`import * as ${exportName} from './${name}.js'`)
        importList.push(exportName)
      } else { // hoist: lower-cased-named File
        textList.push(`export { ${exportList.join(', ')} } from './${name}.js'`)
      }
    })

    importList.length && textList.push(`export { ${importList.join(', ')} }`)

    indexScriptMap[ [ ...routeList, 'index.js' ].join('/') ] = textList.join('\n')
  })

  return indexScriptMap
}

const HOIST_LIST_KEY = '~hoist'
const EXPORT_LIST_KEY = '~export'
const EXPORT_HOIST_LIST_KEY = '~export-hoist'

const generateExportInfo = ({ sourceRouteMap }) => {
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

    fileList.forEach(({ name, exportList }) => {
      const shouldMergeExport = directoryList.length || isFirstUpperCase(name)

      if (shouldMergeExport) {
        exportInfo[ toExportName(name) ] = { [ EXPORT_LIST_KEY ]: exportList }
      } else {
        exportInfo[ name ] = { [ HOIST_LIST_KEY ]: exportList }
        exportInfo[ EXPORT_HOIST_LIST_KEY ] = [
          ...(exportInfo[ EXPORT_HOIST_LIST_KEY ] || []),
          ...exportList
        ]
      }

      getExportInfo(...routeList, name)[ EXPORT_LIST_KEY ] = exportList
    })
  })

  return exportInfoMap
}

export {
  generateIndexScript,
  HOIST_LIST_KEY,
  EXPORT_LIST_KEY,
  EXPORT_HOIST_LIST_KEY,
  generateExportInfo
}
