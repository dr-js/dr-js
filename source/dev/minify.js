import { relative } from 'node:path'

import { tryRequire } from 'source/env/tryRequire.js'
import { clock } from 'source/common/time.js'
import { binary, time, padTable } from 'source/common/format.js'

import { editBuffer } from 'source/node/fs/File.js'

// TODO: copy (2 of 2)
//  keep webpack related comment (https://webpack.js.org/api/module-methods/#magic-comments)
//    webpackChunkName: "my-chunk-name"
//    webpackMode: "lazy"
//  keep license related comment
//    @license
//    @preserve
//  and keep basic jsdoc tag comment
//    @deprecated
//    @type
//    @params
//    @arg(uments)
//    @return(s)
const REGEXP_COMMENT_KEEP = /webpack\w+:|@(license|preserve|deprecated|type|params|arg|return)/

const GET_TERSER = (log = console.warn) => {
  const Terser = tryRequire('terser')
  if (Terser) return Terser
  const error = new Error('[Terser] failed to load package "terser"')
  log(error)
  throw error
}

const getTerserOption = ({
  isReadable = false, // should be much more readable // TODO: option `beautify` is being removed
  isDevelopment = false,
  ecma = 8, // specify one of: 5, 6, 7 or 8; use ES8/ES2017 for native async
  toplevel = true, // enable top level variable and function name mangling and to drop unused variables and functions
  globalDefineMap = {
    '__DEV__': Boolean(isDevelopment),
    'process.env.NODE_ENV': isDevelopment ? 'development' : 'production'
  },
  comments = REGEXP_COMMENT_KEEP
} = {}) => ({
  ecma, toplevel, module,
  compress: { passes: 2, join_vars: false, sequences: false, global_defs: globalDefineMap },
  mangle: isReadable ? false : { eval: true },
  output: isReadable ? { beautify: true, indent_level: 2, width: 240, comments } : { beautify: false, semicolons: false, comments },
  sourceMap: false
})

const minifyFileWithTerser = async ({
  kit, kitLogger = kit,
  Terser = GET_TERSER(kitLogger.log),

  filePath, option
}) => {
  const result = {
    timeStart: clock()
    // timeEnd: 0,
    // sizeSource: 0,
    // sizeOutput: 0
  }
  await editBuffer(async (buffer) => {
    const { error, code: scriptOutput } = await Terser.minify(String(buffer), option)
    if (error) {
      kitLogger.padLog(`[minifyFileWithTerser] failed to minify file: ${filePath}`)
      throw error
    }
    const bufferOutput = Buffer.from(scriptOutput)
    result.timeEnd = clock()
    result.sizeSource = buffer.length
    result.sizeOutput = bufferOutput.length
    return bufferOutput
  }, filePath)
  return result
}

const minifyFileListWithTerser = async ({
  kit, kitLogger = kit,
  fileList, option,
  outputPath = (kit && kit.fromOutput()) || ''
}) => {
  kitLogger.padLog(`minify ${fileList.length} file with terser`)

  const table = []
  const totalTimeStart = clock()
  let totalSizeSource = 0
  let totalSizeDelta = 0
  for (const filePath of fileList) {
    const { sizeSource, sizeOutput, timeStart, timeEnd } = await minifyFileWithTerser({ filePath, option, kit, kitLogger })
    const sizeDelta = sizeOutput - sizeSource
    totalSizeSource += sizeSource
    totalSizeDelta += sizeDelta
    kitLogger.isVerbose && table.push([
      `∆ ${(100 * sizeDelta / sizeSource).toFixed(2)}% (${binary(sizeDelta)}B)`,
      time(timeEnd - timeStart),
      `${relative(outputPath, filePath)}`
    ])
  }
  kitLogger.isVerbose && table.push([ '--', '--', '--' ])
  table.push([
    `∆ ${(100 * totalSizeDelta / totalSizeSource).toFixed(2)}% (${binary(totalSizeDelta)}B)`,
    time(clock() - totalTimeStart),
    `TOTAL of ${fileList.length} file (${binary(totalSizeSource)}B)`
  ])

  kitLogger.log(`result:\n  ${padTable({ table, padFuncList: [ 'L', 'R', 'L' ], cellPad: ' | ', rowPad: '\n  ' })}`)

  return totalSizeDelta
}

export {
  GET_TERSER,
  getTerserOption,
  minifyFileWithTerser,
  minifyFileListWithTerser
}
