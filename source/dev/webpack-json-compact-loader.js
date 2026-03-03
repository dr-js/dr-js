import { dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import { tryRequire } from 'source/env/tryRequire.js'
import { isBasicObject } from 'source/common/check.js'
import { run } from 'source/node/run.js'

const GET_BABEL_PARSER_PARSE = (log = console.warn) => {
  const BabelParser = tryRequire('@babel/parser')
  if (BabelParser && BabelParser.parse) return BabelParser.parse
  const error = new Error('[JSONCompactLoader] failed to load package "@babel/parser"')
  log(error)
  throw error
}

const DEFAULT_BABEL_CONFIG = {
  configFile: false, babelrc: false,
  plugins: [ [ '@babel/plugin-transform-modules-commonjs' ] ] // NOTE: change this to `@babel/preset-env` if more complex js is used
}
const cleanBabelRequire = async (babelConfig, filePath, exportName) => {
  // NOTE: webpack loader share the global, to avoid global pollution,
  //   `require` is run in another node process,
  //   the good thing is `require` cache is clean every time
  const { promise, stdoutPromise } = run([
    process.execPath, // node
    '--eval',
    [
      `require('@babel/register')(${JSON.stringify(babelConfig || DEFAULT_BABEL_CONFIG)})`,
      `const data = require(${JSON.stringify(filePath)})[ ${JSON.stringify(exportName)} ]`,
      'process.stdout.write(JSON.stringify(data))' // use this instead of `console.log` to prevent tailing `\n`
    ].join(';')
  ], { quiet: true })
  await promise.catch(async (error) => {
    console.error('[JSONCompactLoader] error in cleanBabelRequire:', error)
    throw error
  })
  return String(await stdoutPromise) // valueJSONString
}

const DEFAULT_PARSER_PLUGIN_LIST = [ 'objectRestSpread', 'exportDefaultFrom', 'exportNamespaceFrom' ] // should be enough for most JSON source
const getImportListOfFileString = (fileString) => {
  const resultAST = GET_BABEL_PARSER_PARSE()(fileString, { sourceType: 'module', plugins: DEFAULT_PARSER_PLUGIN_LIST })
  // Sample output, check: https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md#importdeclaration
  // Node {
  //   type: 'ImportDeclaration',
  //   source: Node {
  //     value: '@dr-js/dev/module/main'
  const importNodeList = resultAST.program.body.filter(({ type }) => type === 'ImportDeclaration')
  return [].concat(...importNodeList.map(({ source: { value } }) => value))
}
const getImportDependencyFileSet = async (pendingPathList, requireResolveAsync) => {
  // console.log({ pendingPathList })
  const parsedFileSet = new Set()
  const importFileSet = new Set()
  while (pendingPathList.length !== 0) {
    const pendingPath = pendingPathList.pop()
    if (parsedFileSet.has(pendingPath)) continue
    parsedFileSet.add(pendingPath)
    const basePath = dirname(pendingPath)
    for (const importPath of getImportListOfFileString(String(readFileSync(pendingPath)))) {
      if (!importPath.startsWith('.')) continue // skip package import
      const importFile = await requireResolveAsync(basePath, importPath)
      if (importFile.endsWith('.js')) pendingPathList.push(importFile)
      else if (!importFile.endsWith('.json')) throw new Error(`[JSONCompactLoader] only ".js/json" is supported, got: ${importFile}`)
      importFileSet.add(importFile)
    }
  }
  // console.log({ importFileSet })
  return importFileSet
}

// Turn JSON value to js String, and select better quote
//   console.log(toJSString({ a: 1 })) // '{"a":1}'
//   console.log(toJSString({ a: "''''''''''''''''''''" })) // "{\"a\":\"''''''''''''''''''''\"}"
//   console.log(toJSString({ a: '""""""""""""""""""""' })) // '{"a":"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\"\\""}'
// On why use `JSON.parse()` in js:
// https://www.youtube.com/watch?v=ff4fgQxPaO0
// https://github.com/webpack/webpack/pull/9349
const toJSString = (value, valueJSONString = JSON.stringify(value)) => {
  let mostlyDoubleQuote = 0
  let result
  const REGEXP_QUOTE = /['"]/g
  while ((result = REGEXP_QUOTE.exec(valueJSONString))) (result[ 0 ] === '"') ? mostlyDoubleQuote++ : mostlyDoubleQuote--
  const QUOTE_CHAR = (mostlyDoubleQuote < 0) ? '"' : '\''

  return `${QUOTE_CHAR}${
    valueJSONString
      .replace(/\\/g, '\\\\') // escape all escape (\)
      .replace(/\u2028|\u2029/g, (v) => v === '\u2029' ? '\\u2029' : '\\u2028') // invalid in JavaScript but valid JSON
      .replace(new RegExp(QUOTE_CHAR, 'g'), '\\' + QUOTE_CHAR)
  }${QUOTE_CHAR}`
}

const JSONCompactLoader = async function (sourceString) {
  let { query: options } = this // https://webpack.js.org/api/loaders/#thisquery
  if (!options) options = { babelConfig: null, useConst: false } // may get empty string, check: https://github.com/webpack/loader-utils/blob/v2.0.0/lib/getOptions.js#L8
  if (!isBasicObject(options)) throw new Error(`[JSONCompactLoader] only JSON option supported, got: ${String(options)}`) // https://github.com/webpack/loader-utils/blob/v2.0.0/lib/getOptions.js#L12-L15

  const callback = this.async()
  try {
    // find the export name
    const result = /export\s*{\s*([\w-]+)\s*}/.exec(sourceString)
    if (!result) throw new Error('[JSONCompactLoader] missing "export { NAME }"')
    const [ , exportName ] = result

    // add import to watch list
    const importFileSet = await getImportDependencyFileSet(
      [ this.resourcePath ],
      (context, path) => new Promise((resolve, reject) => this.resolve(context, path, (error, result) => error ? reject(error) : resolve(result)))
    )
    importFileSet.forEach((importFile) => this.addDependency(importFile))

    // run with sandbox-ed require
    const valueJSONString = await cleanBabelRequire(options.babelConfig, this.resourcePath, exportName)
    // console.log('[JSONCompactLoader]', { valueJSONString })

    // output compact
    callback(null, [
      `${options.useConst ? 'const' : 'var'} ${exportName} = JSON.parse(${toJSString(null, valueJSONString)})`,
      `export { ${exportName} }`
    ].join('\n'))
  } catch (error) { return callback(error) }
}

module.exports = JSONCompactLoader
