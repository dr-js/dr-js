import { isBasicObject } from 'source/common/check.js'

const EXPORT_MODE_EXPORT_EACH = 'export-each' // export like: `export const ${key} = ${JSON.stringify(value)}`, need set `type: 'javascript/auto'`, check: https://webpack.js.org/configuration/module/#ruletype
const EXPORT_MODE_EXPORT_DEFAULT = 'export-default' // export like: `export default { ${key0}, ${key1}, ${key2}, ... }`, need set `type: 'javascript/auto'`
const EXPORT_MODE_EXPORT_BOTH = 'export-both' // export both named and default, need set `type: 'javascript/auto'`
const EXPORT_MODE_JSON = 'json' // export as picked JSON Object String

const EXPORT_MODE_LIST = [ EXPORT_MODE_EXPORT_EACH, EXPORT_MODE_EXPORT_DEFAULT, EXPORT_MODE_EXPORT_BOTH, EXPORT_MODE_JSON ]

const JSONPickLoader = function (sourceString) {
  const sourceObject = JSON.parse(sourceString)
  if (!isBasicObject(sourceObject)) throw new Error(`[JSONPickLoader] source file should be Object JSON, got: ${String(sourceObject)}`)

  const { query: options } = this // https://webpack.js.org/api/loaders/#thisquery
  if (!isBasicObject(options)) throw new Error(`[JSONPickLoader] only JSON option supported, got: ${String(options)}`) // https://github.com/webpack/loader-utils/blob/v2.0.0/lib/getOptions.js#L12-L15

  const {
    keys = [],
    exportMode = EXPORT_MODE_EXPORT_BOTH,
    useConst = false,
    _def = useConst ? 'const' : 'var'
  } = options // NOTE: names in `options.keys` should be valid JS variable names.
  if (!EXPORT_MODE_LIST.includes(exportMode)) throw new Error(`[JSONPickLoader] invalid exportMode: ${String(exportMode)}`)

  const outputStringList = []
  switch (exportMode) {
    case EXPORT_MODE_EXPORT_EACH: {
      for (const key of keys) {
        const value = sourceObject[ key ]
        verifyPick(key, value)
        outputStringList.push(`export ${_def} ${key} = ${JSON.stringify(value)}`)
      }
      break
    }
    case EXPORT_MODE_EXPORT_DEFAULT:
    case EXPORT_MODE_EXPORT_BOTH: {
      const isBothMode = exportMode === EXPORT_MODE_EXPORT_BOTH
      const exportItemList = []
      for (let index = 0, indexMax = keys.length; index < indexMax; index++) {
        const key = keys[ index ]
        const value = sourceObject[ key ]
        verifyPick(key, value)
        outputStringList.push(isBothMode ? `export ${_def} ${key} = ${JSON.stringify(value)}` : `${_def} _${index} = ${JSON.stringify(value)}`)
        exportItemList.push(isBothMode ? key : `_${index} as ${key}`)
      }
      outputStringList.push('export default {', exportItemList.join(','), '}')
      break
    }
    case EXPORT_MODE_JSON: {
      const pickedObject = {}
      for (const key of keys) {
        const value = sourceObject[ key ]
        verifyPick(key, value)
        pickedObject[ key ] = value
      }
      outputStringList.push(JSON.stringify(pickedObject))
      break
    }
    default:
      throw new Error(`[JSONPickLoader] invalid exportMode: ${String(exportMode)}`)
  }

  return outputStringList.join('\n')
}
const verifyPick = (key, value) => { if (value === undefined) throw new Error(`[JSONPickLoader] source JSON missing key: ${String(key)}`) }

module.exports = JSONPickLoader
