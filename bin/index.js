#!/usr/bin/env node

const __DEV__ = false

const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const Dr = require('../library/Dr.node')
const { parseCLI, parseENV, parseJSON, processOptionMap, exitWithError } = require('./option')
const { createServerServeStatic } = require('./server-serve-static')

const readFileAsync = promisify(nodeModuleFs.readFile)
const {
  Env: { isNode, isBrowser, environmentName, systemEndianness },
  Node: { File: { modify, getFileList } }
} = Dr

const main = async () => {
  let optionMap = optionMapResolvePath(parseCLI(process.argv), process.cwd())

  const getOption = (name, argumentCount) => {
    const argumentList = getOptionOptional(name) || exitWithError(new Error(`[option] missing option ${name}`))
    if (argumentCount !== undefined && argumentList.length !== argumentCount) exitWithError(new Error(`[option] expecting ${name} has ${argumentCount} value instead of ${argumentList.length}`))
    return argumentList
  }
  const getOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList
  const getSingleOption = (name) => getOption(name, 1)[ 0 ]
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

  try {
    switch (getSingleOption('mode')) {
      case 'env-info':
        return console.log(JSON.stringify({ isNode, isBrowser, environmentName, systemEndianness }, null, '  '))
      case 'file-list':
      case 'ls':
        return console.log(JSON.stringify(await getFileList(getSingleOption('argument'))))
      case 'file-modify-copy':
      case 'cp':
        return modify.copy(...getOption('argument', 2))
      case 'file-modify-move':
      case 'mv':
        return modify.move(...getOption('argument', 2))
      case 'file-modify-delete':
      case 'rm':
        for (const path of getOption('argument')) await modify.delete(path).then(() => console.log(`[DELETE-DONE] ${path}`), (error) => console.warn(`[DELETE-ERROR] ${error}`))
        return
      case 'server-serve-static':
      case 'sss':
        let [ staticRoot, hostname = '0.0.0.0', port = 80 ] = getOptionOptional('argument')
        staticRoot = nodeModulePath.resolve(optionMap[ 'argument' ].source === 'JSON' ? nodeModulePath.dirname(config) : process.cwd(), staticRoot)
        return createServerServeStatic({ staticRoot, protocol: 'http:', hostname, port })
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${getSingleOption('mode')}:\n`, error)
    process.exit(2)
  }
}

const optionMapResolvePath = (optionMap, pathRelative) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = nodeModulePath.resolve(pathRelative, v))))
  return optionMap
}

main().catch(exitWithError)
