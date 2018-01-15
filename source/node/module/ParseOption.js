const nodeModulePath = require('path')
const nodeModuleFs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(nodeModuleFs.readFile)

const parseOptionMap = async ({ parseCLI, parseENV, parseJSON, processOptionMap }) => {
  const optionMapCLI = optionMapResolvePath(parseCLI(process.argv), process.cwd())
  const config = getSingleOptionOptional(optionMapCLI, 'config')
  const optionMapExtend = !config ? null
    : config === 'env' ? optionMapResolvePath(parseENV(process.env), process.cwd())
      : optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), nodeModulePath.dirname(config))
  const optionMap = processOptionMap({ ...optionMapExtend, ...optionMapCLI })
  __DEV__ && console.log('[parseOption] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(getOption(optionMap, name))}`))
  return optionMap
}

const optionMapResolvePath = (optionMap, pathRoot) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = nodeModulePath.resolve(pathRoot, v))))
  return optionMap
}

const createOptionGetter = (optionMap) => {
  const getOptionOptional = (name) => optionMap[ name ] ? optionMap[ name ].argumentList : undefined
  const getOption = (name, argumentCount) => {
    const argumentList = getOptionOptional(name)
    if (!argumentList) throw new Error(`[getOption] expecting option ${name}`)
    if (argumentCount !== undefined && argumentList.length !== argumentCount) throw new Error(`[getOption] expecting option ${name} has ${argumentCount} value instead of ${argumentList.length}`)
    return argumentList
  }
  return {
    getOptionOptional,
    getOption,
    getSingleOptionOptional: (name) => optionMap[ name ] ? optionMap[ name ].argumentList[ 0 ] : undefined,
    getSingleOption: (name) => getOption(name, 1)[ 0 ]
  }
}

// TODO: DEPRECATED
const getOptionOptional = (optionMap, name) => optionMap[ name ] ? optionMap[ name ].argumentList : undefined
const getSingleOptionOptional = (optionMap, name) => optionMap[ name ] ? optionMap[ name ].argumentList[ 0 ] : undefined
const getOption = (optionMap, name, argumentCount) => {
  const argumentList = getOptionOptional(optionMap, name)
  if (!argumentList) throw new Error(`[parseOption] expecting option ${name}`)
  if (argumentCount !== undefined && argumentList.length !== argumentCount) throw new Error(`[parseOption] expecting option ${name} has ${argumentCount} value instead of ${argumentList.length}`)
  return argumentList
}
const getSingleOption = (optionMap, name) => getOption(optionMap, name, 1)[ 0 ]

export {
  parseOptionMap,
  createOptionGetter,
  getOptionOptional, // TODO: DEPRECATED
  getOption, // TODO: DEPRECATED
  getSingleOptionOptional, // TODO: DEPRECATED
  getSingleOption // TODO: DEPRECATED
}
