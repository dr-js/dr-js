import { resolve, dirname } from 'path'
import { tryRequire } from 'source/env/tryRequire'
import { createOptionParser } from 'source/common/module/Option/parser'
import { ConfigPreset } from 'source/common/module/Option/preset'

const { SingleString, AllString } = ConfigPreset
const ConfigPresetNode = {
  ...ConfigPreset,
  SinglePath: { ...SingleString, isPath: true },
  AllPath: { ...AllString, isPath: true },
  Config: { // common config preset
    ...SingleString,
    optional: true,
    name: 'config',
    shortName: 'c',
    description: [
      `from ENV: set to 'env'`,
      `from JS/JSON file: set to 'path/to/config.js|json'`
    ].join('\n')
  }
}

const parseOptionMap = async ({ parseCLI, parseENV, parseCONFIG, processOptionMap }) => {
  const optionMapCLI = optionMapResolvePath(parseCLI(process.argv.slice(2)), process.cwd()) // TODO: NOTE: process.argv.slice(2) to drop [node executable] [script file], may not good for all situations
  const config = optionMapCLI[ 'config' ] && optionMapCLI[ 'config' ].argumentList[ 0 ]
  const optionMapExtend = !config ? null
    : config === 'env' ? optionMapResolvePath(parseENV(process.env), process.cwd())
      : optionMapResolvePath(
        parseCONFIG(tryRequire(resolve(process.cwd(), config))),
        dirname(resolve(process.cwd(), config))
      )
  const optionMap = processOptionMap({
    ...optionMapExtend, // allow overwrite by cli
    ...optionMapCLI
  })
  __DEV__ && console.log('[parseOptionMap] get:')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${JSON.stringify(optionMap[ name ])}`))
  return optionMap
}
const optionMapResolvePath = (optionMap, pathRoot) => { // NOTE: will mutate argumentList in optionMap
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = resolve(pathRoot, v))))
  return optionMap
}

const createOptionGetter = (optionMap) => {
  const getOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList
  const getOption = (name, argumentCount) => {
    const argumentList = getOptionOptional(name)
    if (!argumentList) throw new Error(`expect option ${name}`)
    if (argumentCount !== undefined && argumentList.length !== argumentCount) throw new Error(`expect option ${name} with ${argumentCount} value, get ${argumentList.length}`)
    return argumentList
  }
  return {
    optionMap,
    getOptionOptional,
    getOption,
    getSingleOptionOptional: (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ],
    getSingleOption: (name) => getOption(name, 1)[ 0 ]
  }
}

const prepareOption = (optionConfig) => {
  const { parseCLI, parseENV, parseCONFIG, processOptionMap, formatUsage } = createOptionParser(optionConfig)
  const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseCONFIG, processOptionMap }))
  return { parseOption, formatUsage }
}

export {
  ConfigPresetNode,

  parseOptionMap,
  createOptionGetter,
  prepareOption
}
