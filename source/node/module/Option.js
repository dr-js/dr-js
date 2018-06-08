import { resolve, dirname } from 'path'
import { createOptionParser } from 'source/common/module/Option/parser'
import { ConfigPreset } from 'source/common/module/Option/preset'
import { readFileAsync } from 'source/node/file/function'

const ConfigPresetNode = {
  ...ConfigPreset,
  SinglePath: { ...ConfigPreset.SingleString, isPath: true },
  AllPath: { ...ConfigPreset.AllString, isPath: true },
  Config: { // common config preset
    ...ConfigPreset.SingleString,
    description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`,
    optional: true,
    name: 'config',
    shortName: 'c'
  }
}

const parseOptionMap = async ({ parseCLI, parseENV, parseJSON, processOptionMap }) => {
  // TODO: NOTE: slice(2) to drop [node executable] [script file], may not good for all situations
  const optionMapCLI = optionMapResolvePath(parseCLI(process.argv.slice(2)), process.cwd())
  const config = optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList.length && optionMapCLI[ 'config' ].argumentList[ 0 ]
  const optionMapExtend = !config ? null
    : config === 'env' ? optionMapResolvePath(parseENV(process.env), process.cwd())
      : optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), dirname(config))
  const optionMap = processOptionMap({ ...optionMapExtend, ...optionMapCLI })
  __DEV__ && console.log('[parseOptionMap] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}
const optionMapResolvePath = (optionMap, pathRoot) => { // NOTE: will mutate argumentList in optionMap
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

const prepareOption = (optionConfig) => {
  const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(optionConfig)
  const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))
  return { parseOption, formatUsage }
}

export {
  parseOptionMap,
  createOptionGetter,
  ConfigPresetNode,
  prepareOption
}
