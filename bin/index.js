#!/usr/bin/env node

const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../library/Dr.node')

const __DEV__ = false
const readFileAsync = promisify(nodeModuleFs.readFile)
const { createOptionParser, OPTION_CONFIG_PRESET } = Dr.Common.Module

const MODE_OPTION = [
  'env-info',
  'file-list',
  'file-modify-copy',
  'file-modify-move',
  'file-modify-delete'
]

const OPTION_CONFIG = {
  prefixENV: 'dr-js',
  formatList: [
    {
      name: 'config',
      shortName: 'c',
      optional: true,
      description: `# from JSON: set to path relative process.cwd()\n# from ENV: set to 'env' to collect from process.env`,
      ...OPTION_CONFIG_PRESET.SingleString
    },
    {
      name: 'mode',
      shortName: 'm',
      description: `should be one of [ ${MODE_OPTION.join(', ')} ]`,
      ...OPTION_CONFIG_PRESET.OneOfString(MODE_OPTION)
    },
    {
      name: 'argument',
      shortName: 'a',
      optional: true,
      argumentCount: '0+'
    }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

const main = async () => {
  let optionMap = optionMapResolvePath(parseCLI(process.argv), process.cwd())
  const getOption = (name, argumentCount) => {
    const argumentList = getOptionOptional(name) || exitWithError(new Error(`[option] missing option ${name}`))
    if (argumentCount !== undefined && argumentList.length !== argumentCount) exitWithError(new Error(`[option] expecting ${name} has ${argumentCount} value instead of ${argumentList.length}`))
    return argumentList
  }
  const getSingleOption = (name) => getOption(name, 1)[ 0 ]
  const getOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList
  const getSingleOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]

  const config = getSingleOptionOptional('config')
  if (config && config.toLowerCase() === 'env') {
    const envOptionMap = optionMapResolvePath(parseENV(process.env), process.cwd())
    optionMap = { ...envOptionMap, ...optionMap }
  } else if (config) {
    const jsonOptionMap = optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), nodeModulePath.dirname(config))
    optionMap = { ...jsonOptionMap, ...optionMap }
  }

  __DEV__ && console.log('[option]')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(getOption(name))}`))

  optionMap = processOptionMap(optionMap)
  __DEV__ && console.log('processOptionMap PASS')

  try {
    switch (getSingleOption('mode')) {
      case 'env-info':
        const { isNode, isBrowser, environmentName, systemEndianness } = Dr.Env
        return console.log({ isNode, isBrowser, environmentName, systemEndianness })
      case 'file-list':
        return console.log(JSON.stringify(await Dr.Node.File.getFileList(getSingleOption('argument'))))
      case 'file-modify-copy':
        return Dr.Node.File.modify.copy(...getOption('argument', 2))
      case 'file-modify-move':
        return Dr.Node.File.modify.move(...getOption('argument', 2))
      case 'file-modify-delete':
        for (const path of getOption('argument')) {
          await Dr.Node.File.modify.delete(path).then(
            () => console.log(`[DELETE-DONE] ${path}`),
            (error) => console.warn(`[DELETE-ERROR] ${error}`)
          )
        }
        return
    }
  } catch (error) { console.warn(`[Error] in mode: ${getSingleOption('mode')}:\n`, error) }
}

const optionMapResolvePath = (optionMap, pathRelative) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = nodeModulePath.resolve(pathRelative, v))))
  return optionMap
}

main().catch(exitWithError)
