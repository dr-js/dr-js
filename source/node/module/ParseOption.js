import { resolve, dirname } from 'path'
import { readFileAsync } from 'source/node/file/__utils__'

const parseOptionMap = async ({ parseCLI, parseENV, parseJSON, processOptionMap }) => {
  const optionMapCLI = optionMapResolvePath(parseCLI(process.argv), process.cwd())
  const config = optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList.length && optionMapCLI[ 'config' ].argumentList[ 0 ]
  const optionMapExtend = !config ? null
    : config === 'env' ? optionMapResolvePath(parseENV(process.env), process.cwd())
      : optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), dirname(config))
  const optionMap = processOptionMap({ ...optionMapExtend, ...optionMapCLI })
  __DEV__ && console.log('[parseOption] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}

const optionMapResolvePath = (optionMap, pathRoot) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = resolve(pathRoot, v))))
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
    optionMap,
    getOptionOptional,
    getOption,
    getSingleOptionOptional: (name) => optionMap[ name ] ? optionMap[ name ].argumentList[ 0 ] : undefined,
    getSingleOption: (name) => getOption(name, 1)[ 0 ]
  }
}

export { parseOptionMap, createOptionGetter }
